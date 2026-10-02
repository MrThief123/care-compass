// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpIfAdmin } from "../helpers/aal2";

// [FAM-11] Requires a running local Supabase stack (`supabase start`, migrations applied). Skips against a
// hosted project, exactly as tests/integration/family-budget-overview.test.ts does. Every call is made as
// a signed-in person through the real Server Action, so RLS and the grants apply.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `fam-11-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/**
 * Margaret at Banksia with: NDIS ($14,880 remaining), Government ($240 remaining and a $310 cost pending
 * since 1 Oct 2026) and Gift ($0, nothing ever charged, so removable). Helen is her family, Priya the
 * Banksia admin, Aisha a carer on a shift with her; Rosa is another client's family and Omar a Wattle admin.
 */
async function seed() {
  const admin = createAdminClient();
  const banksia = await admin
    .from("organisations")
    .insert({ name: unique("banksia") })
    .select("id")
    .single();
  const wattle = await admin
    .from("organisations")
    .insert({ name: unique("wattle") })
    .select("id")
    .single();
  if (banksia.error || !banksia.data || wattle.error || !wattle.data)
    throw new Error("organisations");

  const helen = await createUser("Helen", "Doyle", "family", null);
  const rosa = await createUser("Rosa", "Doyle", "family", null);
  const priya = await createUser("Priya", "Nair", "admin", banksia.data.id);
  const omar = await createUser("Omar", "Said", "admin", wattle.data.id);
  const aisha = await createUser("Aisha", "Rahman", "carer", banksia.data.id);

  const client = await admin
    .from("clients")
    .insert({
      first_name: "Margaret",
      last_name: unique("client"),
      organisation_id: banksia.data.id,
    })
    .select("id")
    .single();
  const other = await admin
    .from("clients")
    .insert({ first_name: "Robert", last_name: unique("client"), organisation_id: wattle.data.id })
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

  async function bucket(name: string, kind: "ndis" | "government" | null, funds: number, paid = 0) {
    const row = await admin
      .from("budget_buckets")
      .insert({ client_id: clientId, name, kind })
      .select("id")
      .single();
    if (row.error || !row.data) throw row.error ?? new Error(name);
    const by = { recorded_by: helen.userId, recorded_by_name: "Helen Doyle" };
    if (funds > 0) {
      await admin.from("budget_fund_entries").insert({
        bucket_id: row.data.id,
        client_id: clientId,
        kind: "funds_added",
        amount: funds,
        description: `${name} top-up`,
        entry_date: "2026-10-01",
        ...by,
      });
    }
    if (paid > 0) {
      await admin.from("budget_costs").insert({
        bucket_id: row.data.id,
        client_id: clientId,
        original_start: new Date().toISOString(),
        description: "Seeded cost",
        amount: paid,
        status: "paid",
        incurred_on: "2026-10-02",
        paid_on: "2026-10-02",
        ...by,
      });
    }
    return row.data.id;
  }

  const ndisId = await bucket("NDIS", "ndis", 14880);
  const governmentId = await bucket("Government", "government", 3000, 2760);
  const giftId = await bucket("Gift", null, 0);
  await admin.from("budget_costs").insert({
    bucket_id: governmentId,
    client_id: clientId,
    original_start: new Date().toISOString(),
    description: "Physiotherapy",
    amount: 310,
    status: "pending",
    incurred_on: "2026-10-01",
    recorded_by: helen.userId,
    recorded_by_name: "Helen Doyle",
  });

  return {
    admin,
    banksiaId: banksia.data.id,
    wattleId: wattle.data.id,
    helen,
    rosa,
    priya,
    omar,
    aisha,
    clientId,
    otherId,
    ndisId,
    governmentId,
    giftId,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa, s.priya, s.omar, s.aisha]) {
    await s.admin.auth.admin.deleteUser(user.userId);
  }
  // The ledgers are append-only for people, not for the service role used to clean up after a test.
  const ids = [s.clientId, s.otherId];
  await s.admin.from("budget_costs").delete().in("client_id", ids);
  await s.admin.from("budget_fund_entries").delete().in("client_id", ids);
  await s.admin.from("care_events").update({ bucket_id: null }).in("client_id", ids);
  await s.admin.from("budget_buckets").delete().in("client_id", ids);
  await s.admin.from("shifts").delete().in("client_id", ids);
  await s.admin.from("clients").delete().in("id", ids);
  await s.admin.from("organisations").delete().in("id", [s.banksiaId, s.wattleId]);
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
  // F0-21: admin RLS needs an AAL2 session, as a real admin has after TOTP.
  await stepUpIfAdmin(client);
  return cookieStore;
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

type Edit = Parameters<typeof import("@/server/budget/actions").saveBudgetEdit>[1];

async function saveAs(session: Map<string, string>, clientId: string, edit: Edit) {
  return withSession(session, async () => {
    const { saveBudgetEdit } = await import("@/server/budget/actions");
    return saveBudgetEdit(clientId, edit);
  });
}

async function readAs(session: Map<string, string>, clientId: string) {
  return withSession(session, async () => {
    const { getBudgetSummary, getFundHistory } = await import("@/server/budget/queries");
    return { summary: await getBudgetSummary(clientId), history: await getFundHistory(clientId) };
  });
}

const row = (
  id: string,
  name: string,
  direction: "add" | "remove",
  amount: number,
  remove = false,
) => ({
  id,
  name,
  direction,
  amount,
  remove,
});

describe.skipIf(!hasLocalSupabase)("[FAM-11] Edit budget saves, against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[FAM-11][AC-01] T-02 Helen adds $1,000 to NDIS: the card says $15,880 and History's first row is '+$1,000' by Helen", async () => {
    const s = await seed();
    try {
      const helen = await signIn(s.helen.email);

      const result = await saveAs(helen, s.clientId, {
        buckets: [row(s.ndisId, "NDIS", "add", 1000)],
        added: [],
      });
      const { summary, history } = await readAs(helen, s.clientId);

      expect(result).toEqual({ ok: true, data: undefined });
      expect(summary.find((b) => b.id === s.ndisId)?.remaining).toBe(15880);
      expect(history[0]).toMatchObject({
        bucketId: s.ndisId,
        type: "topup",
        amount: 1000,
        recordedBy: "Helen Doyle",
      });
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-11][AC-06] T-15 a top-up pays the pending cost: Government is $30 remaining with no pending cost and the cost reads paid later", async () => {
    const s = await seed();
    try {
      const helen = await signIn(s.helen.email);

      await saveAs(helen, s.clientId, {
        buckets: [row(s.governmentId, "Government", "add", 100)],
        added: [],
      });
      const { summary, history } = await readAs(helen, s.clientId);

      const government = summary.find((b) => b.id === s.governmentId);
      expect(government?.remaining).toBe(30);
      expect(government?.pendingCount ?? 0).toBe(0);
      const cost = history.find((e) => e.description === "Physiotherapy");
      expect(cost?.pending).toBeUndefined();
      expect(cost?.paidOn).toBeDefined();
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-11][AC-05] T-15 a mixed save with a note is read back as the screen draws it", async () => {
    const s = await seed();
    try {
      const helen = await signIn(s.helen.email);

      const result = await saveAs(helen, s.clientId, {
        buckets: [
          row(s.ndisId, "NDIS", "remove", 880),
          row(s.governmentId, "Government support", "add", 0),
          row(s.giftId, "Gift", "add", 0, true),
        ],
        added: [{ name: "Council grant", startingAmount: 1200 }],
        note: "Q3 plan review",
      });
      const { summary, history } = await readAs(helen, s.clientId);

      expect(result).toEqual({ ok: true, data: undefined });
      expect(summary.map((b) => b.label).sort()).toEqual([
        "Council grant",
        "Government support",
        "NDIS",
      ]);
      expect(summary.find((b) => b.label === "NDIS")?.remaining).toBe(14000);
      const saved = history.filter((e) => e.note === "Q3 plan review");
      expect(saved.map((e) => e.amount).sort((a, b) => a - b)).toEqual([-880, 0, 1200]);
      expect(saved.every((e) => e.recordedBy === "Helen Doyle")).toBe(true);
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-11][AC-02][AC-04] T-03 a removal over the balance, beside a valid top-up, is refused on its field and nothing is saved", async () => {
    const s = await seed();
    try {
      const helen = await signIn(s.helen.email);
      const before = await readAs(helen, s.clientId);

      const result = await saveAs(helen, s.clientId, {
        buckets: [
          row(s.ndisId, "NDIS", "add", 100),
          row(s.governmentId, "Government", "remove", 300),
        ],
        added: [],
      });
      const after = await readAs(helen, s.clientId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION");
        expect(Object.keys(result.error.fields ?? {})).toEqual(["buckets.1.amount"]);
      }
      expect(after).toEqual(before);
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-11][AC-03] T-06 a carer, another client's family and another organisation's admin are refused and nothing changes", async () => {
    const s = await seed();
    try {
      const helen = await signIn(s.helen.email);
      const before = await readAs(helen, s.clientId);
      const edit = { buckets: [row(s.ndisId, "NDIS", "add", 5)], added: [] };

      for (const person of [s.aisha, s.rosa, s.omar]) {
        const session = await signIn(person.email);
        const result = await saveAs(session, s.clientId, edit);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");
      }

      expect(await readAs(helen, s.clientId)).toEqual(before);
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-11][AC-03] T-06 an admin of the client's organisation saves, and History names that admin", async () => {
    const s = await seed();
    try {
      const priya = await signIn(s.priya.email);

      const result = await saveAs(priya, s.clientId, {
        buckets: [row(s.ndisId, "NDIS", "add", 25)],
        added: [],
      });
      const { history } = await readAs(priya, s.clientId);

      expect(result).toEqual({ ok: true, data: undefined });
      expect(history[0]).toMatchObject({ amount: 25, recordedBy: "Priya Nair" });
    } finally {
      await cleanUp(s);
    }
  });
});
