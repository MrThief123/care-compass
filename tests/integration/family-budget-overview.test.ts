// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied). Skips against a
// hosted project, exactly as tests/integration/family-home-budget-strip.test.ts does.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `fam-10-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
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
    last_name: "Test",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/**
 * One bucket (NDIS) with: a top-up, a paid cost that was never pending (`incurred_on === paid_on`), a
 * cost that was pending and later paid on a different day, and a still-pending cost — so the four
 * `FundEntry` shapes `getFundHistory` must produce (topup, plain paid expense, "paid on" expense,
 * pending expense) all come from one seed. Robert has a bucket with no ledger rows at all (AC-03).
 */
async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("org") })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const helen = await createUser("Helen", "family", null);
  const rosa = await createUser("Rosa", "family", null);
  const priya = await createUser("Priya", "admin", org.data.id);
  const aisha = await createUser("Aisha", "carer", org.data.id);
  const dan = await createUser("Dan", "carer", org.data.id);

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  const other = await admin
    .from("clients")
    .insert({ first_name: "Robert", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data || other.error || !other.data) throw new Error("clients");
  const clientId = client.data.id;
  const otherId = other.data.id;

  await admin.from("client_family_members").insert([
    { client_id: clientId, profile_id: helen.userId },
    { client_id: otherId, profile_id: rosa.userId },
  ]);
  await admin.from("shifts").insert({
    client_id: clientId,
    carer_id: aisha.userId,
    starts_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  const ndis = await admin
    .from("budget_buckets")
    .insert({ client_id: clientId, name: "NDIS", kind: "ndis" })
    .select("id")
    .single();
  const other_bucket = await admin
    .from("budget_buckets")
    .insert({ client_id: otherId, name: "NDIS", kind: "ndis" })
    .select("id")
    .single();
  if (ndis.error || !ndis.data || other_bucket.error || !other_bucket.data) {
    throw new Error("buckets");
  }
  const ndisId = ndis.data.id;
  const otherBucketId = other_bucket.data.id;

  const recordedBy = { recorded_by: helen.userId, recorded_by_name: "Helen Doyle" };
  await admin.from("budget_fund_entries").insert({
    bucket_id: ndisId,
    client_id: clientId,
    kind: "funds_added",
    amount: 6000,
    description: "NDIS quarterly plan top-up",
    entry_date: "2026-11-03",
    ...recordedBy,
  });
  await admin.from("budget_costs").insert([
    {
      bucket_id: ndisId,
      client_id: clientId,
      original_start: new Date().toISOString(),
      description: "Paid straight away",
      amount: 100,
      status: "paid",
      incurred_on: "2026-10-15",
      paid_on: "2026-10-15",
      ...recordedBy,
    },
    {
      bucket_id: ndisId,
      client_id: clientId,
      original_start: new Date().toISOString(),
      description: "Physiotherapy",
      amount: 200,
      status: "paid",
      incurred_on: "2026-10-10",
      paid_on: "2026-10-20",
      ...recordedBy,
    },
    {
      bucket_id: ndisId,
      client_id: clientId,
      original_start: new Date().toISOString(),
      description: "Still pending",
      amount: 50,
      status: "pending",
      incurred_on: "2026-10-27",
      ...recordedBy,
    },
  ]);

  return {
    admin,
    orgId: org.data.id,
    helen,
    rosa,
    priya,
    aisha,
    dan,
    clientId,
    otherId,
    ndisId,
    otherBucketId,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa, s.priya, s.aisha, s.dan]) {
    await s.admin.auth.admin.deleteUser(user.userId);
  }
  const bucketIds = [s.ndisId, s.otherBucketId];
  await s.admin.from("budget_costs").delete().in("bucket_id", bucketIds);
  await s.admin.from("budget_fund_entries").delete().in("bucket_id", bucketIds);
  await s.admin.from("budget_buckets").delete().in("id", bucketIds);
  await s.admin.from("clients").delete().in("id", [s.clientId, s.otherId]);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
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

async function historyAs(session: Map<string, string>, clientId: string) {
  return withSession(session, async () => {
    const { getFundHistory } = await import("@/server/budget/queries");
    return getFundHistory(clientId);
  });
}

describe.skipIf(!hasLocalSupabase)(
  "[FAM-10][AC-02][AC-03] Family Budget — History against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[FAM-10][AC-02] T-05 returns entries newest first, the first being 3 Nov 2026 'NDIS quarterly plan top-up' +$6,000", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const history = await historyAs(cookieStore, s.clientId);

        expect(history[0]).toMatchObject({
          clientId: s.clientId,
          bucketId: s.ndisId,
          bucketKind: "ndis",
          type: "topup",
          amount: 6000,
          date: "2026-11-03",
          description: "NDIS quarterly plan top-up",
          recordedBy: "Helen Doyle",
        });
        expect(history.map((entry) => entry.date)).toEqual(
          [...history.map((e) => e.date)].sort().reverse(),
        );
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-10][AC-02] T-05 a cost paid the same day it was incurred reads as a plain paid expense, with no pending flag or paidOn", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const history = await historyAs(cookieStore, s.clientId);
        const entry = history.find((e) => e.description === "Paid straight away");

        expect(entry).toMatchObject({ type: "expense", amount: -100, date: "2026-10-15" });
        expect(entry?.pending).toBeUndefined();
        expect(entry?.paidOn).toBeUndefined();
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-10][AC-02] T-05 a cost that was pending and later paid keeps its incurred date and carries paidOn", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const history = await historyAs(cookieStore, s.clientId);
        const entry = history.find((e) => e.description === "Physiotherapy");

        expect(entry).toMatchObject({
          type: "expense",
          amount: -200,
          date: "2026-10-10",
          paidOn: "2026-10-20",
        });
        expect(entry?.pending).toBeUndefined();
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-10][AC-02] T-05 a still-pending cost is listed by its incurred date with pending true", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const history = await historyAs(cookieStore, s.clientId);
        const entry = history.find((e) => e.description === "Still pending");

        expect(entry).toMatchObject({
          type: "expense",
          amount: -50,
          date: "2026-10-27",
          pending: true,
        });
        expect(entry?.paidOn).toBeUndefined();
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-10][AC-03] T-05 a client with no fund entries or costs returns an empty array", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.rosa.email);

        const history = await historyAs(cookieStore, s.otherId);

        expect(history).toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-10][Scope] an assigned carer on an active shift can read the history", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.aisha.email);

        const history = await historyAs(cookieStore, s.clientId);

        expect(history.length).toBe(4);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-10][Scope] the organisation's admin can read the history", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.priya.email);

        const history = await historyAs(cookieStore, s.clientId);

        expect(history.length).toBe(4);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-10][Scope] a carer with no active shift for the client reads no history (RLS)", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.dan.email);

        const history = await historyAs(cookieStore, s.clientId);

        expect(history).toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-10][Scope] an unrelated family member reads no history (RLS)", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.rosa.email);

        const history = await historyAs(cookieStore, s.clientId);

        expect(history).toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });
  },
);
