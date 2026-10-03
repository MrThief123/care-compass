// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpIfAdmin } from "../helpers/aal2";

// ADM-11. Requires a running local Supabase stack (`supabase start`, migrations applied). Skips
// against a hosted project, exactly as tests/integration/admin-client-remove.test.ts does. Every call
// is made as a signed-in admin through the real Server Action or contract function, so RLS applies.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `adm-11-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  lastName: string,
  role: "family" | "carer" | "admin",
  organisationId: string | null,
) {
  const admin = createAdminClient();
  const email = `${unique(firstName.toLowerCase())}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("failed to create the test user");
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role,
    organisation_id: organisationId,
    first_name: firstName,
    last_name: lastName,
    email,
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/**
 * Margaret at one organisation with an NDIS bucket ($1,000 added) and a weekly task. Priya is that
 * organisation's admin; Wendy administers another organisation; Helen is Margaret's family.
 */
async function seed() {
  const admin = createAdminClient();
  const orgs = await admin
    .from("organisations")
    .insert([{ name: unique("org") }, { name: unique("other-org") }])
    .select("id");
  if (orgs.error || orgs.data?.length !== 2) throw orgs.error ?? new Error("orgs");
  const [orgId, otherOrgId] = [orgs.data[0]!.id, orgs.data[1]!.id];

  const priya = await createUser("Priya", "Nair", "admin", orgId);
  const wendy = await createUser("Wendy", "Cho", "admin", otherOrgId);
  const helen = await createUser("Helen", "Doyle", "family", null);

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: orgId })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.userId });

  const bucket = await admin
    .from("budget_buckets")
    .insert({ client_id: client.data.id, name: "NDIS" })
    .select("id")
    .single();
  if (bucket.error || !bucket.data) throw bucket.error ?? new Error("bucket");
  await admin.from("budget_fund_entries").insert({
    bucket_id: bucket.data.id,
    client_id: client.data.id,
    kind: "funds_added",
    amount: 1000,
    recorded_by: helen.userId,
    recorded_by_name: "Helen Doyle",
  });

  const startsAt = new Date(Math.floor((Date.now() - 2 * 3_600_000) / 1000) * 1000).toISOString();
  const event = await admin
    .from("care_events")
    .insert({
      client_id: client.data.id,
      title: unique("medication"),
      starts_at: startsAt,
      duration_minutes: 15,
      completion_mode: "manual",
      created_by: helen.userId,
    })
    .select("id")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");

  return {
    admin,
    orgId,
    otherOrgId,
    priya,
    wendy,
    helen,
    clientId: client.data.id,
    bucketId: bucket.data.id,
    occurrenceKey: `${event.data.id}:${startsAt}`,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const userId of [s.priya.userId, s.wendy.userId, s.helen.userId]) {
    await s.admin.auth.admin.deleteUser(userId);
  }
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().in("id", [s.orgId, s.otherOrgId]);
}

function cookieClient(cookieStore: Map<string, string>) {
  const asCookieList = () => [...cookieStore.entries()].map(([name, value]) => ({ name, value }));
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: asCookieList,
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value)),
      },
    },
  );
}

async function signIn(email: string) {
  const cookieStore = new Map<string, string>();
  const client = cookieClient(cookieStore);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  expect(error).toBeNull();
  // F0-21: admin RLS needs an AAL2 session; family and carers are never stepped up.
  await stepUpIfAdmin(client);
  return { cookieStore, client };
}

async function withSession<T>(cookieStore: Map<string, string>, run: () => Promise<T>): Promise<T> {
  const asCookieList = () => [...cookieStore.entries()].map(([name, value]) => ({ name, value }));
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      getAll: asCookieList,
      set: (name: string, value: string) => cookieStore.set(name, value),
    }),
    headers: async () => new Headers({ host: "127.0.0.1:3000", "x-forwarded-proto": "http" }),
  }));
  vi.stubEnv("DATA_SOURCE", "supabase");
  try {
    return await run();
  } finally {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  }
}

describe.skipIf(!hasLocalSupabase)("[ADM-11] Admin — Client view against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[ADM-11][AC-03] Priya adds $500 to NDIS: the bucket grows and History reads recorded by Priya Nair", async () => {
    const s = await seed();
    try {
      const priya = await signIn(s.priya.email);
      const outcome = await withSession(priya.cookieStore, async () => {
        const { saveBudgetEdit } = await import("@/server/budget/actions");
        return saveBudgetEdit(s.clientId, {
          buckets: [{ id: s.bucketId, name: "NDIS", direction: "add", amount: 500, remove: false }],
          added: [],
        });
      });
      expect(outcome).toEqual({ ok: true, data: undefined });

      const { summary, history } = await withSession(priya.cookieStore, async () => {
        const { getBudgetSummary, getFundHistory } = await import("@/server/budget/queries");
        return {
          summary: await getBudgetSummary(s.clientId),
          history: await getFundHistory(s.clientId),
        };
      });
      expect(summary.find((bucket) => bucket.id === s.bucketId)?.total).toBe(1500);
      expect(history.find((entry) => entry.amount === 500)?.recordedBy).toBe("Priya Nair");
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-11][AC-04] Priya edits client information, adds an event with a cost and ticks and unticks a task, each naming her", async () => {
    const s = await seed();
    try {
      const priya = await signIn(s.priya.email);

      const info = await withSession(priya.cookieStore, async () => {
        const { saveClientInfoSection } = await import("@/server/clients/actions");
        return saveClientInfoSection(s.clientId, "habits", "Prefers tea over coffee.");
      });
      expect(info.ok).toBe(true);
      const stored = await s.admin
        .from("client_info_sections")
        .select("body, updated_by")
        .eq("client_id", s.clientId)
        .eq("key", "habits")
        .single();
      expect(stored.data).toEqual({ body: "Prefers tea over coffee.", updated_by: s.priya.userId });

      const created = await withSession(priya.cookieStore, async () => {
        const { createEvent } = await import("@/server/events/actions");
        return createEvent({
          clientId: s.clientId,
          title: unique("physio"),
          description: "",
          date: "2026-12-07",
          startTime: "10:00",
          durationMinutes: 30,
          recurrence: "none",
          isTask: false,
          cost: { amount: 40, bucketId: s.bucketId },
        });
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      const event = await s.admin
        .from("care_events")
        .select("created_by, cost, bucket_id")
        .eq("id", created.data.eventId)
        .single();
      expect(event.data).toMatchObject({
        created_by: s.priya.userId,
        cost: 40,
        bucket_id: s.bucketId,
      });

      const ticked = await withSession(priya.cookieStore, async () => {
        const { setOccurrenceDone } = await import("@/server/events/actions");
        return setOccurrenceDone(s.occurrenceKey);
      });
      expect(ticked).toMatchObject({ ok: true, data: { actor: "Priya Nair" } });

      const unticked = await withSession(priya.cookieStore, async () => {
        const { setOccurrenceUndone } = await import("@/server/events/actions");
        return setOccurrenceUndone(s.occurrenceKey);
      });
      expect(unticked.ok).toBe(true);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-11][AC-05] Wendy, admin of another organisation, reads nothing of Margaret's and every write is refused", async () => {
    const s = await seed();
    try {
      const wendy = await signIn(s.wendy.email);

      const header = await withSession(wendy.cookieStore, async () => {
        const { getClientHeaderSummary } = await import("@/server/clients/queries");
        return getClientHeaderSummary(s.clientId).then(
          () => "read",
          () => "refused",
        );
      });
      expect(header).toBe("refused");

      const results = await withSession(wendy.cookieStore, async () => {
        const { saveBudgetEdit } = await import("@/server/budget/actions");
        const { createEvent, setOccurrenceDone } = await import("@/server/events/actions");
        const { saveClientInfoSection } = await import("@/server/clients/actions");
        return {
          budget: await saveBudgetEdit(s.clientId, {
            buckets: [{ id: s.bucketId, name: "NDIS", direction: "add", amount: 1, remove: false }],
            added: [],
          }),
          event: await createEvent({
            clientId: s.clientId,
            title: "Intruder",
            description: "",
            date: "2026-12-07",
            startTime: "10:00",
            durationMinutes: 30,
            recurrence: "none",
            isTask: false,
          }),
          tick: await setOccurrenceDone(s.occurrenceKey),
          info: await saveClientInfoSection(s.clientId, "description", "x"),
        };
      });
      for (const result of Object.values(results)) expect(result.ok).toBe(false);

      const untouched = await s.admin
        .from("care_events")
        .select("id", { count: "exact", head: true })
        .eq("client_id", s.clientId);
      expect(untouched.count).toBe(1);
      const entries = await s.admin
        .from("budget_fund_entries")
        .select("id", { count: "exact", head: true })
        .eq("client_id", s.clientId);
      expect(entries.count).toBe(1);
    } finally {
      await cleanUp(s);
    }
  });
});
