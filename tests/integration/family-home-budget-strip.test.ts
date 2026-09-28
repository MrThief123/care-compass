// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied). Skips against a
// hosted project, exactly as tests/integration/family-add-event.test.ts does.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `fam-03-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
 * Margaret has NDIS (38% used, ok) and Government (92% used, alert, one pending cost) — the same
 * figures FAM-UI-05's own mock-mode tests use, so the Supabase branch can be checked against known
 * numbers. Robert has no buckets at all (AC-04's empty case).
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
  // On an active shift for Margaret: can read the budget.
  const aisha = await createUser("Aisha", "carer", org.data.id);
  // Never given a shift for Margaret: `can_read_budget` refuses her.
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
  const government = await admin
    .from("budget_buckets")
    .insert({ client_id: clientId, name: "Government", kind: "government" })
    .select("id")
    .single();
  if (ndis.error || !ndis.data || government.error || !government.data) {
    throw new Error("buckets");
  }
  const ndisId = ndis.data.id;
  const governmentId = government.data.id;

  const recordedBy = { recorded_by: helen.userId, recorded_by_name: "Helen Doyle" };
  const today = new Date().toISOString().slice(0, 10);
  await admin.from("budget_fund_entries").insert([
    { bucket_id: ndisId, client_id: clientId, kind: "funds_added", amount: 24000, ...recordedBy },
    {
      bucket_id: governmentId,
      client_id: clientId,
      kind: "funds_added",
      amount: 3000,
      ...recordedBy,
    },
  ]);
  await admin.from("budget_costs").insert([
    {
      bucket_id: ndisId,
      client_id: clientId,
      original_start: new Date().toISOString(),
      description: "Seeded cost",
      amount: 9120,
      status: "paid",
      incurred_on: today,
      paid_on: today,
      ...recordedBy,
    },
    {
      bucket_id: governmentId,
      client_id: clientId,
      original_start: new Date().toISOString(),
      description: "Seeded cost",
      amount: 2760,
      status: "paid",
      incurred_on: today,
      paid_on: today,
      ...recordedBy,
    },
    {
      bucket_id: governmentId,
      client_id: clientId,
      original_start: new Date(Date.now() + 1000).toISOString(),
      description: "Physiotherapy",
      amount: 310,
      status: "pending",
      incurred_on: today,
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
    governmentId,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa, s.priya, s.aisha, s.dan]) {
    await s.admin.auth.admin.deleteUser(user.userId);
  }
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

async function budgetAs(session: Map<string, string>, clientId: string) {
  return withSession(session, async () => {
    const { getBudgetSummary } = await import("@/server/budget/queries");
    return getBudgetSummary(clientId);
  });
}

describe.skipIf(!hasLocalSupabase)(
  "[FAM-03] Family Home — Budget strip against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[FAM-03][AC-03] T-03 NDIS: $14,880 remaining of $24,000, 38% used, ok state", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const buckets = await budgetAs(cookieStore, s.clientId);
        const ndis = buckets.find((bucket) => bucket.id === s.ndisId);

        expect(ndis).toMatchObject({
          label: "NDIS",
          kind: "ndis",
          total: 24000,
          used: 9120,
          remaining: 14880,
          percentUsed: 38,
          state: "ok",
          pendingTotal: 0,
          pendingCount: 0,
        });
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-03][AC-02] T-02 Government: $240 remaining of $3,000, 92% used, alert state, one pending cost", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const buckets = await budgetAs(cookieStore, s.clientId);
        const government = buckets.find((bucket) => bucket.id === s.governmentId);

        expect(government).toMatchObject({
          label: "Government",
          kind: "government",
          total: 3000,
          used: 2760,
          remaining: 240,
          percentUsed: 92,
          state: "alert",
          pendingTotal: 310,
          pendingCount: 1,
        });
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-03][AC-04] T-04 a client with no buckets returns an empty array", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.rosa.email);

        const buckets = await budgetAs(cookieStore, s.otherId);

        expect(buckets).toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-03][Scope] an assigned carer on an active shift can read the budget", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.aisha.email);

        const buckets = await budgetAs(cookieStore, s.clientId);

        expect(buckets.map((bucket) => bucket.label).sort()).toEqual(["Government", "NDIS"]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-03][Scope] the organisation's admin can read the budget", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.priya.email);

        const buckets = await budgetAs(cookieStore, s.clientId);

        expect(buckets.map((bucket) => bucket.label).sort()).toEqual(["Government", "NDIS"]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-03][Scope] a carer with no active shift for the client reads no buckets (RLS)", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.dan.email);

        const buckets = await budgetAs(cookieStore, s.clientId);

        expect(buckets).toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-03][Scope] an unrelated family member reads no buckets (RLS)", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.rosa.email);

        const buckets = await budgetAs(cookieStore, s.clientId);

        expect(buckets).toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });
  },
);
