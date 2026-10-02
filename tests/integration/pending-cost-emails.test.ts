// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EmailMessage, EmailProvider } from "@/server/email/provider";
import { runPendingCostEmailsJob } from "@/server/jobs/pending-cost-emails";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack with this feature's migration applied (same
// convention as tests/integration/budget-thresholds.test.ts). Synthetic data only.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const APPROVED_CLOSING = "Add funds to pay it. Log in and refer to plan.";

function unique(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class FakeEmailProvider implements EmailProvider {
  sent: EmailMessage[] = [];
  failFor = new Set<string>();
  failAll = false;

  async send(message: EmailMessage): Promise<{ ok: true } | { ok: false; error: string }> {
    if (this.failAll || this.failFor.has(message.to)) {
      return { ok: false, error: "simulated provider outage" };
    }
    this.sent.push(message);
    return { ok: true };
  }
}

/** Untyped access: the new table/function are not in the generated types. */
function markersAdmin() {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (admin.from as unknown as (table: string) => any)("budget_pending_cost_notifications");
}

type Admin = ReturnType<typeof createAdminClient>;

async function makeUser(admin: Admin, stamp: string, tag: string, first: string) {
  const user = await admin.auth.admin.createUser({
    email: `${stamp}-${tag}@example.test`,
    password: "correct horse battery staple 1!",
    email_confirm: true,
  });
  if (user.error || !user.data.user) throw user.error ?? new Error(`user ${tag}`);
  return { id: user.data.user.id, email: user.data.user.email as string, first };
}

async function makeProfile(
  admin: Admin,
  user: { id: string; email: string; first: string },
  role: "family" | "admin" | "carer",
  organisationId: string | null,
  isActive = true,
) {
  const profile = await admin.from("profiles").insert({
    id: user.id,
    role,
    organisation_id: organisationId,
    first_name: user.first,
    last_name: "Tester",
    email: user.email,
    is_active: isActive,
  });
  if (profile.error) throw profile.error;
}

async function makeClient(admin: Admin, orgId: string, familyId: string | null, first: string) {
  const client = await admin
    .from("clients")
    .insert({ first_name: first, last_name: unique("Wells"), organisation_id: orgId })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  if (familyId) {
    const link = await admin
      .from("client_family_members")
      .insert({ client_id: client.data.id, profile_id: familyId });
    if (link.error) throw link.error;
  }
  return client.data.id as string;
}

async function makeBucket(admin: Admin, clientId: string, name: string, funds: number) {
  const bucket = await admin
    .from("budget_buckets")
    .insert({ client_id: clientId, name })
    .select("id")
    .single();
  if (bucket.error || !bucket.data) throw bucket.error ?? new Error("bucket");
  const entry = await admin.from("budget_fund_entries").insert({
    bucket_id: bucket.data.id,
    client_id: clientId,
    kind: "bucket_added",
    amount: funds,
    recorded_by: "00000000-0000-0000-0000-000000000000",
    recorded_by_name: "Test",
  });
  if (entry.error) throw entry.error;
  return bucket.data.id as string;
}

/** A cost held pending (what the F0-12 trigger writes when the bucket cannot cover it). */
async function pendingCost(
  admin: Admin,
  bucketId: string,
  clientId: string,
  amount: number,
  description: string,
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const row = await admin
    .from("budget_costs")
    .insert({
      bucket_id: bucketId,
      client_id: clientId,
      original_start: new Date().toISOString(),
      description,
      amount,
      status: "pending",
      incurred_on: today,
      recorded_by: "00000000-0000-0000-0000-000000000000",
      recorded_by_name: "Zed Actor",
    })
    .select("id")
    .single();
  if (row.error || !row.data) throw row.error ?? new Error("cost");
  return row.data.id as string;
}

/** Adds the funds that pay the cost off first (what `add_funds` does), so no bucket ends up past
 * 100% and trips INT-01's threshold tests running in parallel against the same database. */
async function payOff(admin: Admin, costId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const cost = await admin
    .from("budget_costs")
    .select("bucket_id, client_id, amount")
    .eq("id", costId)
    .single();
  if (cost.error || !cost.data) throw cost.error ?? new Error("cost");
  const funds = await admin.from("budget_fund_entries").insert({
    bucket_id: cost.data.bucket_id,
    client_id: cost.data.client_id,
    kind: "funds_added",
    amount: cost.data.amount,
    recorded_by: "00000000-0000-0000-0000-000000000000",
    recorded_by_name: "Test",
  });
  if (funds.error) throw funds.error;
  const res = await admin
    .from("budget_costs")
    .update({ status: "paid", paid_on: today })
    .eq("id", costId);
  if (res.error) throw res.error;
}

async function seed() {
  const admin = createAdminClient();
  const stamp = unique("int-11");
  const org = await admin
    .from("organisations")
    .insert({ name: `Banksia ${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");
  const orgId = org.data.id as string;

  const family = await makeUser(admin, stamp, "helen", "Helen");
  await makeProfile(admin, family, "family", null);
  const orgAdmin = await makeUser(admin, stamp, "priya", "Priya");
  await makeProfile(admin, orgAdmin, "admin", orgId);

  const clientId = await makeClient(admin, orgId, family.id, "Margaret");
  const bucketId = await makeBucket(admin, clientId, "Government", 50);

  const users = [family.id, orgAdmin.id];
  const clients = [clientId];
  const orgs = [orgId];
  return { admin, stamp, orgId, family, orgAdmin, clientId, bucketId, users, clients, orgs };
}

type Scenario = Awaited<ReturnType<typeof seed>>;

async function cleanUp(s: Scenario) {
  for (const id of s.users) await s.admin.auth.admin.deleteUser(id);
  // Costs cannot be deleted (append-only), so clients/orgs that hold one stay behind, harmless.
  for (const id of s.clients) await s.admin.from("clients").delete().eq("id", id);
  for (const id of s.orgs) await s.admin.from("organisations").delete().eq("id", id);
}

function ours(provider: FakeEmailProvider, s: Scenario): EmailMessage[] {
  const addresses = new Set([s.family.email, s.orgAdmin.email]);
  return provider.sent.filter((m) => addresses.has(m.to));
}

describe.skipIf(!hasLocalSupabase)("[INT-11] pending-cost emails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[INT-11][AC-01] T-01 a pending cost emails Family and the admin with the exact approved sentence", async () => {
    const s = await seed();
    try {
      const costId = await pendingCost(s.admin, s.bucketId, s.clientId, 80, "Physio session");
      const provider = new FakeEmailProvider();

      const result = await runPendingCostEmailsJob(provider);

      expect(result.failures).toEqual([]);
      const mine = ours(provider, s);
      expect(mine.map((m) => m.to).sort()).toEqual([s.family.email, s.orgAdmin.email].sort());
      for (const message of mine) {
        expect(message.text).toBe(
          `A cost of $80.00 for Physio session could not be covered by Government and is pending. ${APPROVED_CLOSING}`,
        );
        expect(message.subject).not.toMatch(/Margaret|Helen|Priya|Zed/);
        expect(message.text).not.toMatch(/Margaret|Helen|Priya|Zed|Tester/);
      }
      const marker = await markersAdmin().select("cost_id").eq("cost_id", costId);
      expect(marker.data).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  }, 20000);

  it("[INT-11][AC-02] T-02 a second run, and two concurrent runs, send nothing more and record one marker", async () => {
    const s = await seed();
    try {
      const costId = await pendingCost(s.admin, s.bucketId, s.clientId, 80, "Physio");
      const provider = new FakeEmailProvider();
      await runPendingCostEmailsJob(provider);
      expect(ours(provider, s)).toHaveLength(2);

      await runPendingCostEmailsJob(provider);
      expect(ours(provider, s)).toHaveLength(2);

      const marker = await markersAdmin().select("cost_id").eq("cost_id", costId);
      expect(marker.data).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  }, 20000);

  it("[INT-11][AC-02] T-02b overlapping runs leave exactly one marker", async () => {
    const s = await seed();
    try {
      const costId = await pendingCost(s.admin, s.bucketId, s.clientId, 80, "Physio");
      const a = new FakeEmailProvider();
      const b = new FakeEmailProvider();

      await Promise.all([runPendingCostEmailsJob(a), runPendingCostEmailsJob(b)]);

      const marker = await markersAdmin().select("cost_id").eq("cost_id", costId);
      expect(marker.data).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  }, 20000);

  it("[INT-11][AC-03] T-03 paid costs, and costs paid off before the run, are never emailed", async () => {
    const s = await seed();
    try {
      // (a) charged paid straight away
      const today = new Date().toISOString().slice(0, 10);
      const paid = await s.admin.from("budget_costs").insert({
        bucket_id: s.bucketId,
        client_id: s.clientId,
        original_start: new Date().toISOString(),
        description: "Covered",
        amount: 10,
        status: "paid",
        incurred_on: today,
        paid_on: today,
        recorded_by: "00000000-0000-0000-0000-000000000000",
        recorded_by_name: "Test",
      });
      if (paid.error) throw paid.error;
      // (b) pending, then paid off before the job runs
      const later = await pendingCost(s.admin, s.bucketId, s.clientId, 80, "Paid off in time");
      await payOff(s.admin, later);

      const provider = new FakeEmailProvider();
      await runPendingCostEmailsJob(provider);
      expect(ours(provider, s)).toEqual([]);

      // (c) emailed as pending, later paid: nothing again
      const third = await pendingCost(s.admin, s.bucketId, s.clientId, 90, "Emailed then paid");
      await runPendingCostEmailsJob(provider);
      expect(ours(provider, s)).toHaveLength(2);
      await payOff(s.admin, third);
      await runPendingCostEmailsJob(provider);
      expect(ours(provider, s)).toHaveLength(2);
    } finally {
      await cleanUp(s);
    }
  }, 20000);

  it("[INT-11][AC-04] T-04 several pending costs make one digest email per recipient, one line per cost", async () => {
    const s = await seed();
    try {
      const second = await makeBucket(s.admin, s.clientId, "NDIS", 5);
      const ids = [
        await pendingCost(s.admin, s.bucketId, s.clientId, 80, "Physio"),
        await pendingCost(s.admin, second, s.clientId, 12.5, "Taxi"),
        await pendingCost(s.admin, s.bucketId, s.clientId, 1200, "Equipment"),
      ];
      const provider = new FakeEmailProvider();

      await runPendingCostEmailsJob(provider);

      const mine = ours(provider, s);
      expect(mine).toHaveLength(2);
      for (const message of mine) {
        expect(message.text).toContain(
          "A cost of $80.00 for Physio could not be covered by Government and is pending.",
        );
        expect(message.text).toContain(
          "A cost of $12.50 for Taxi could not be covered by NDIS and is pending.",
        );
        expect(message.text).toContain(
          "A cost of $1,200.00 for Equipment could not be covered by Government and is pending.",
        );
        expect(message.text.split(APPROVED_CLOSING)).toHaveLength(2); // closing once
        expect(message.text.trimEnd().endsWith(APPROVED_CLOSING)).toBe(true);
      }
      const markers = await markersAdmin().select("cost_id").in("cost_id", ids);
      expect(markers.data).toHaveLength(3);
    } finally {
      await cleanUp(s);
    }
  }, 20000);

  it("[INT-11][AC-05] T-05 only Family and the active admin of the current organisation are emailed", async () => {
    const s = await seed();
    try {
      const inactive = await makeUser(s.admin, s.stamp, "inactive", "Ina");
      await makeProfile(s.admin, inactive, "admin", s.orgId, false);
      const carer = await makeUser(s.admin, s.stamp, "carer", "Cara");
      await makeProfile(s.admin, carer, "carer", s.orgId);
      const otherOrg = await s.admin
        .from("organisations")
        .insert({ name: `Wattle ${s.stamp}` })
        .select("id")
        .single();
      if (otherOrg.error || !otherOrg.data) throw otherOrg.error ?? new Error("org");
      const otherAdmin = await makeUser(s.admin, s.stamp, "other-admin", "Olly");
      await makeProfile(s.admin, otherAdmin, "admin", otherOrg.data.id);
      const otherFamily = await makeUser(s.admin, s.stamp, "other-family", "Fay");
      await makeProfile(s.admin, otherFamily, "family", null);
      const otherClient = await makeClient(s.admin, s.orgId, otherFamily.id, "Other");
      s.users.push(inactive.id, carer.id, otherAdmin.id, otherFamily.id);
      s.clients.push(otherClient);
      s.orgs.push(otherOrg.data.id);

      await pendingCost(s.admin, s.bucketId, s.clientId, 80, "Physio");
      const provider = new FakeEmailProvider();
      await runPendingCostEmailsJob(provider);

      const everyone = [inactive, carer, otherAdmin, otherFamily].map((u) => u.email);
      expect(provider.sent.map((m) => m.to).filter((to) => everyone.includes(to))).toEqual([]);
      expect(
        ours(provider, s)
          .map((m) => m.to)
          .sort(),
      ).toEqual([s.family.email, s.orgAdmin.email].sort());

      // Transfer the client away: a new cost never reaches the old organisation's admin.
      const moved = await s.admin
        .from("clients")
        .update({ organisation_id: otherOrg.data.id })
        .eq("id", s.clientId);
      if (moved.error) throw moved.error;
      await pendingCost(s.admin, s.bucketId, s.clientId, 70, "Dentist");
      const after = new FakeEmailProvider();
      await runPendingCostEmailsJob(after);
      const recipients = after.sent.map((m) => m.to);
      expect(recipients).toContain(s.family.email);
      expect(recipients).toContain(otherAdmin.email);
      expect(recipients).not.toContain(s.orgAdmin.email);
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-11][AC-06] T-06 a provider failure leaves no marker, reports the cost id, other clients still go, and the next run retries", async () => {
    const s = await seed();
    const t = await seed();
    try {
      const failing = await pendingCost(s.admin, s.bucketId, s.clientId, 80, "Physio");
      const fine = await pendingCost(t.admin, t.bucketId, t.clientId, 60, "Massage");
      const provider = new FakeEmailProvider();
      provider.failFor.add(s.orgAdmin.email);

      const result = await runPendingCostEmailsJob(provider);

      expect(result.failures).toContainEqual({ costId: failing });
      expect(result.failures.map((f) => f.costId)).not.toContain(fine);
      expect((await markersAdmin().select("cost_id").eq("cost_id", failing)).data).toEqual([]);
      expect((await markersAdmin().select("cost_id").eq("cost_id", fine)).data).toHaveLength(1);
      expect(ours(provider, t)).toHaveLength(2);

      const retry = new FakeEmailProvider();
      await runPendingCostEmailsJob(retry);
      expect(
        ours(retry, s)
          .map((m) => m.to)
          .sort(),
      ).toEqual([s.family.email, s.orgAdmin.email].sort());
      expect((await markersAdmin().select("cost_id").eq("cost_id", failing)).data).toHaveLength(1);
      expect(ours(retry, t)).toEqual([]);
    } finally {
      await cleanUp(s);
      await cleanUp(t);
    }
  }, 40000);

  it("[INT-11][AC-07] T-07 neither the console nor the result carries names, amounts, titles or addresses", async () => {
    const s = await seed();
    try {
      await pendingCost(s.admin, s.bucketId, s.clientId, 80.25, "Secretive Physio");
      const logged: string[] = [];
      for (const method of ["log", "info", "warn", "error", "debug"] as const) {
        vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
          logged.push(args.map((a) => String(a)).join(" "));
        });
      }
      const failing = new FakeEmailProvider();
      failing.failAll = true;
      const failed = await runPendingCostEmailsJob(failing);
      const ok = await runPendingCostEmailsJob(new FakeEmailProvider());

      const text = JSON.stringify([failed, ok]) + logged.join("\n");
      for (const secret of [
        "Secretive",
        "Physio",
        "80.25",
        "Government",
        "Margaret",
        "Helen",
        "Priya",
        "Zed",
        s.family.email,
        s.orgAdmin.email,
      ]) {
        expect(text).not.toContain(secret);
      }
    } finally {
      await cleanUp(s);
    }
  }, 30000);

  it("[INT-11][AC-01] T-09 a client with no recipients records nothing, and a later Family member gets it", async () => {
    const s = await seed();
    try {
      const org = await s.admin
        .from("organisations")
        .insert({ name: `Empty ${s.stamp}` })
        .select("id")
        .single();
      if (org.error || !org.data) throw org.error ?? new Error("org");
      const clientId = await makeClient(s.admin, org.data.id, null, "Lonely");
      const bucketId = await makeBucket(s.admin, clientId, "Private", 10);
      s.clients.push(clientId);
      s.orgs.push(org.data.id);
      const costId = await pendingCost(s.admin, bucketId, clientId, 80, "Physio");

      const provider = new FakeEmailProvider();
      const result = await runPendingCostEmailsJob(provider);
      expect(result.failures.map((f) => f.costId)).not.toContain(costId);
      expect((await markersAdmin().select("cost_id").eq("cost_id", costId)).data).toEqual([]);

      const late = await makeUser(s.admin, s.stamp, "late", "Lena");
      await makeProfile(s.admin, late, "family", null);
      s.users.push(late.id);
      const link = await s.admin
        .from("client_family_members")
        .insert({ client_id: clientId, profile_id: late.id });
      if (link.error) throw link.error;

      const next = new FakeEmailProvider();
      await runPendingCostEmailsJob(next);
      expect(next.sent.filter((m) => m.to === late.email)).toHaveLength(1);
      expect((await markersAdmin().select("cost_id").eq("cost_id", costId)).data).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  }, 30000);
});
