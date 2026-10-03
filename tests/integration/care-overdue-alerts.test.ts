// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EmailMessage, EmailProvider } from "@/server/email/provider";
import { runCareOverdueAlertsJob } from "@/server/jobs/care-overdue-alerts";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack with this feature's migration applied (same convention
// as tests/integration/pending-cost-emails.test.ts). Synthetic data only. Each run is scoped to the
// scenario's own client (`clientIds`) so seed data and parallel tests never share its cap or markers.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const MIN = 60_000;

function unique(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class FakeEmailProvider implements EmailProvider {
  sent: EmailMessage[] = [];
  failFor = new Set<string>();

  async send(message: EmailMessage): Promise<{ ok: true } | { ok: false; error: string }> {
    if (this.failFor.has(message.to)) return { ok: false, error: "simulated provider outage" };
    this.sent.push(message);
    return { ok: true };
  }
}

type Admin = ReturnType<typeof createAdminClient>;

/** Untyped access: the new table is not in the generated types. */
function markers(admin: Admin) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (admin.from as unknown as (table: string) => any)("care_overdue_alert_notifications");
}

async function makeUser(admin: Admin, stamp: string, tag: string) {
  const user = await admin.auth.admin.createUser({
    email: `${stamp}-${tag}@example.test`,
    password: "correct horse battery staple 1!",
    email_confirm: true,
  });
  if (user.error || !user.data.user) throw user.error ?? new Error(`user ${tag}`);
  return { id: user.data.user.id, email: user.data.user.email as string };
}

async function makeProfile(
  admin: Admin,
  user: { id: string; email: string },
  role: "family" | "admin" | "carer",
  organisationId: string | null,
  first: string,
  isActive = true,
  email: string | null = user.email,
) {
  const profile = await admin.from("profiles").insert({
    id: user.id,
    role,
    organisation_id: organisationId,
    first_name: first,
    last_name: "Tester",
    email,
    is_active: isActive,
  });
  if (profile.error) throw profile.error;
}

async function makeOrg(admin: Admin, stamp: string) {
  const org = await admin
    .from("organisations")
    .insert({ name: `Banksia ${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");
  return org.data.id as string;
}

async function makeClient(admin: Admin, orgId: string | null, familyIds: string[]) {
  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("Wells"), organisation_id: orgId })
    .select("id, last_name")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  for (const profileId of familyIds) {
    const link = await admin
      .from("client_family_members")
      .insert({ client_id: client.data.id, profile_id: profileId });
    if (link.error) throw link.error;
  }
  return { id: client.data.id as string, lastName: client.data.last_name as string };
}

/** A one-off task (or plain event) that started `minutesAgo` minutes ago, to the whole second. */
async function makeEvent(
  admin: Admin,
  clientId: string,
  title: string,
  minutesAgo: number,
  mode: "manual" | "automatic" = "manual",
) {
  const startsAt = new Date(
    Math.floor((Date.now() - minutesAgo * MIN) / 1000) * 1000,
  ).toISOString();
  const event = await admin
    .from("care_events")
    .insert({ client_id: clientId, title, starts_at: startsAt, completion_mode: mode })
    .select("id")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");
  return { id: event.data.id as string, startsAt };
}

async function seed() {
  const admin = createAdminClient();
  const stamp = unique("int-09");
  const orgId = await makeOrg(admin, stamp);
  const family = await makeUser(admin, stamp, "helen");
  await makeProfile(admin, family, "family", null, "Helen");
  const orgAdmin = await makeUser(admin, stamp, "priya");
  await makeProfile(admin, orgAdmin, "admin", orgId, "Priya");
  const carer = await makeUser(admin, stamp, "aisha");
  await makeProfile(admin, carer, "carer", orgId, "Aisha");
  const client = await makeClient(admin, orgId, [family.id]);
  const users = [family.id, orgAdmin.id, carer.id];
  return {
    admin,
    stamp,
    orgId,
    family,
    orgAdmin,
    carer,
    client,
    clientId: client.id,
    users,
    orgs: [orgId],
    clients: [client.id],
  };
}

type Scenario = Awaited<ReturnType<typeof seed>>;

async function cleanUp(s: Scenario) {
  for (const id of s.users) await s.admin.auth.admin.deleteUser(id);
  // Events with completions cannot be deleted (append-only), so what holds one stays behind, harmless.
  for (const id of s.clients) await s.admin.from("care_events").delete().eq("client_id", id);
  for (const id of s.clients) await s.admin.from("clients").delete().eq("id", id);
  for (const id of s.orgs) await s.admin.from("organisations").delete().eq("id", id);
}

function run(provider: FakeEmailProvider, s: Scenario, extra: { maxAlerts?: number } = {}) {
  return runCareOverdueAlertsJob(provider, { clientIds: [s.clientId], ...extra });
}

describe.skipIf(!hasLocalSupabase)("[INT-09] overdue care alert emails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[INT-09][AC-01] T-01 an overdue task emails Family and the org admin once each, never the carer, and records one row", async () => {
    const s = await seed();
    try {
      const event = await makeEvent(s.admin, s.clientId, "Morning medication", 90);
      const provider = new FakeEmailProvider();

      const result = await run(provider, s);

      expect(result.failures).toEqual([]);
      expect(provider.sent.map((m) => m.to).sort()).toEqual(
        [s.family.email, s.orgAdmin.email].sort(),
      );
      expect(provider.sent.some((m) => m.to === s.carer.email)).toBe(false);
      for (const message of provider.sent) {
        expect(message.text).toContain('"Morning medication" for Margaret');
        expect(message.text).toContain("has not been marked done");
      }
      const rows = await markers(s.admin)
        .select("event_id, original_start")
        .eq("event_id", event.id);
      expect(rows.data).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-09][AC-02] T-02 a second run, and two overlapping runs, send nothing more and leave one row", async () => {
    const s = await seed();
    try {
      const event = await makeEvent(s.admin, s.clientId, "Evening medication", 120);
      const provider = new FakeEmailProvider();
      await run(provider, s);
      expect(provider.sent).toHaveLength(2);

      await run(provider, s);
      expect(provider.sent).toHaveLength(2);

      const racing = [new FakeEmailProvider(), new FakeEmailProvider()];
      await Promise.all(racing.map((p) => run(p, s)));
      expect(racing.flatMap((p) => p.sent)).toEqual([]);
      const rows = await markers(s.admin).select("event_id").eq("event_id", event.id);
      expect(rows.data).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-09][AC-02] T-02b an occurrence moved by an override is still the one occurrence", async () => {
    const s = await seed();
    try {
      const event = await makeEvent(s.admin, s.clientId, "Physio", 180);
      const provider = new FakeEmailProvider();
      await run(provider, s);
      expect(provider.sent).toHaveLength(2);

      const moved = new Date(Math.floor((Date.now() - 60 * MIN) / 1000) * 1000).toISOString();
      const override = await s.admin.from("care_event_overrides").insert({
        event_id: event.id,
        client_id: s.clientId,
        original_start: event.startsAt,
        kind: "modified",
        new_starts_at: moved,
      });
      if (override.error) throw override.error;

      await run(provider, s);
      expect(provider.sent).toHaveLength(2);
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-09][AC-03] T-03 done, cancelled, plain-event, too-new and too-old occurrences are not emailed", async () => {
    const s = await seed();
    try {
      const done = await makeEvent(s.admin, s.clientId, "Done already", 120);
      const completed = await s.admin.from("care_event_completions").insert({
        event_id: done.id,
        client_id: s.clientId,
        original_start: done.startsAt,
        action: "done",
        actor_id: s.carer.id,
        actor_display_name: "Aisha Tester",
        organisation_id: s.orgId,
      });
      if (completed.error) throw completed.error;

      const cancelled = await makeEvent(s.admin, s.clientId, "Cancelled", 120);
      const cancel = await s.admin.from("care_event_overrides").insert({
        event_id: cancelled.id,
        client_id: s.clientId,
        original_start: cancelled.startsAt,
        kind: "cancelled",
      });
      if (cancel.error) throw cancel.error;

      await makeEvent(s.admin, s.clientId, "Plain event", 120, "automatic");
      await makeEvent(s.admin, s.clientId, "Too new", 10);
      await makeEvent(s.admin, s.clientId, "Too old", 49 * 60);

      const provider = new FakeEmailProvider();
      await run(provider, s);
      expect(provider.sent).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-09][AC-04] T-04 a provider failure for one recipient records nothing; the next run sends it", async () => {
    const s = await seed();
    try {
      const event = await makeEvent(s.admin, s.clientId, "Lunch", 100);
      const failing = new FakeEmailProvider();
      failing.failFor.add(s.orgAdmin.email);

      const first = await run(failing, s);
      expect(first.failures).toHaveLength(1);
      const none = await markers(s.admin).select("event_id").eq("event_id", event.id);
      expect(none.data).toHaveLength(0);

      const working = new FakeEmailProvider();
      await run(working, s);
      expect(working.sent.map((m) => m.to).sort()).toEqual(
        [s.family.email, s.orgAdmin.email].sort(),
      );
      const rows = await markers(s.admin).select("event_id").eq("event_id", event.id);
      expect(rows.data).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-09][AC-06] T-07 inactive and email-less profiles, and a client with nobody to tell, are skipped without a row", async () => {
    const s = await seed();
    try {
      const inactive = await makeUser(s.admin, s.stamp, "gone");
      await makeProfile(s.admin, inactive, "admin", s.orgId, "Gone", false);
      s.users.push(inactive.id);
      const noEmail = await makeUser(s.admin, s.stamp, "blank");
      await makeProfile(s.admin, noEmail, "admin", s.orgId, "Blank", true, null);
      s.users.push(noEmail.id);

      const event = await makeEvent(s.admin, s.clientId, "Dinner", 100);
      const provider = new FakeEmailProvider();
      await run(provider, s);
      expect(provider.sent.map((m) => m.to).sort()).toEqual(
        [s.family.email, s.orgAdmin.email].sort(),
      );

      // A client with no family and no organisation has nobody to tell: skipped, no row.
      const lonely = await makeClient(s.admin, null, []);
      s.clients.push(lonely.id);
      const lonelyEvent = await makeEvent(s.admin, lonely.id, "Nobody", 100);
      const other = new FakeEmailProvider();
      await runCareOverdueAlertsJob(other, { clientIds: [lonely.id] });
      expect(other.sent).toEqual([]);
      const rows = await markers(s.admin).select("event_id").eq("event_id", lonelyEvent.id);
      expect(rows.data).toHaveLength(0);
      expect(event.id).toBeTruthy();
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-09][AC-06] T-07b a client moved to another organisation alerts only the new organisation's admins", async () => {
    const s = await seed();
    try {
      const newOrg = await makeOrg(s.admin, `${s.stamp}-new`);
      s.orgs.push(newOrg);
      const newAdmin = await makeUser(s.admin, s.stamp, "newadmin");
      await makeProfile(s.admin, newAdmin, "admin", newOrg, "Newadmin");
      s.users.push(newAdmin.id);
      const moved = await s.admin
        .from("clients")
        .update({ organisation_id: newOrg })
        .eq("id", s.clientId);
      if (moved.error) throw moved.error;

      await makeEvent(s.admin, s.clientId, "After the move", 100);
      const provider = new FakeEmailProvider();
      await run(provider, s);

      expect(provider.sent.map((m) => m.to).sort()).toEqual(
        [s.family.email, newAdmin.email].sort(),
      );
      expect(provider.sent.some((m) => m.to === s.orgAdmin.email)).toBe(false);
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-09][AC-07] T-08 at most maxAlerts occurrences are sent per run, oldest first; the rest go on the next run", async () => {
    const s = await seed();
    try {
      await makeEvent(s.admin, s.clientId, "Third", 60);
      await makeEvent(s.admin, s.clientId, "First", 300);
      await makeEvent(s.admin, s.clientId, "Second", 120);
      const provider = new FakeEmailProvider();

      await run(provider, s, { maxAlerts: 2 });
      const titles = (messages: EmailMessage[]) => [
        ...new Set(messages.map((m) => /"([^"]+)"/.exec(m.text)?.[1])),
      ];
      expect(titles(provider.sent)).toEqual(["First", "Second"]);

      await run(provider, s, { maxAlerts: 2 });
      expect(titles(provider.sent)).toEqual(["First", "Second", "Third"]);
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-09][AC-06] T-07c the result and the logs carry ids only, no names or addresses", async () => {
    const s = await seed();
    try {
      await makeEvent(s.admin, s.clientId, "Evening medication", 100);
      const failing = new FakeEmailProvider();
      failing.failFor.add(s.family.email);
      const logged: string[] = [];
      for (const method of ["log", "info", "warn", "error"] as const) {
        vi.spyOn(console, method).mockImplementation((...args) => {
          logged.push(args.map(String).join(" "));
        });
      }

      const result = await run(failing, s);

      const everything = JSON.stringify(result) + logged.join("\n");
      expect(everything).not.toMatch(/Margaret|Helen|Priya|Tester|example\.test/);
    } finally {
      await cleanUp(s);
    }
  }, 30000);
});
