// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied).
// These tests create and delete organisations, users, clients and shifts, and
// they need this feature's migration (`get_carer_shifts`), so they run only when NEXT_PUBLIC_SUPABASE_URL is
// a local address and skip against a hosted project. If `.env.local` points at a hosted
// project, override the three variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `car-05-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(label: string, role: "family" | "carer", organisationId: string | null) {
  const admin = createAdminClient();
  const email = `${unique(label)}@example.test`;
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
    first_name: label,
    last_name: "Test",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
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

async function signedInAs(email: string) {
  const cookieStore = new Map<string, string>();
  const { error } = await cookieClient(cookieStore).auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  expect(error).toBeNull();
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

type RpcClient = {
  rpc: (
    fn: string,
    args: object,
  ) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
};

/** Melbourne is UTC+11 on these dates (AEDT until 7 April 2030). */
const MON_4 = { start: "2030-03-04T08:00:00+11:00", end: "2030-03-04T12:00:00+11:00" };
const WED_6 = { start: "2030-03-06T09:00:00+11:00", end: "2030-03-06T11:00:00+11:00" };
const TUE_5 = { start: "2030-03-05T08:00:00+11:00", end: "2030-03-05T12:00:00+11:00" };
const SUN_10_LATE = { start: "2030-03-10T23:30:00+11:00", end: "2030-03-11T01:30:00+11:00" };
const MON_11_EARLY = { start: "2030-03-11T00:30:00+11:00", end: "2030-03-11T02:30:00+11:00" };
const WEEK = { from: "2030-03-04", to: "2030-03-10" };

const iso = (value: string) => new Date(value).toISOString();

/**
 * Banksia (Aisha, Daniel, Margaret Doyle) and Wattle (Priya, Robert Lee). The far-future dates
 * make the results independent of today's date.
 */
async function seed() {
  const admin = createAdminClient();
  const orgs = await admin
    .from("organisations")
    .insert([{ name: unique("banksia") }, { name: unique("wattle") }])
    .select("id");
  if (orgs.error || orgs.data?.length !== 2) throw orgs.error ?? new Error("orgs");
  const [banksia, wattle] = orgs.data;

  const helen = await createUser("helen", "family", null);
  const aisha = await createUser("aisha", "carer", banksia!.id);
  const daniel = await createUser("daniel", "carer", banksia!.id);
  const priya = await createUser("priya", "carer", wattle!.id);

  const clients = await admin
    .from("clients")
    .insert([
      { first_name: "Margaret", last_name: "Doyle", organisation_id: banksia!.id },
      { first_name: "Robert", last_name: "Lee", organisation_id: wattle!.id },
    ])
    .select("id, first_name");
  if (clients.error || clients.data?.length !== 2) throw clients.error ?? new Error("clients");
  const margaretId = clients.data.find((c) => c.first_name === "Margaret")!.id;
  const robertId = clients.data.find((c) => c.first_name === "Robert")!.id;

  const link = await admin
    .from("client_family_members")
    .insert({ client_id: margaretId, profile_id: helen.userId });
  if (link.error) throw link.error;

  const row = (carer: { userId: string }, clientId: string, w: { start: string; end: string }) => ({
    client_id: clientId,
    carer_id: carer.userId,
    starts_at: iso(w.start),
    ends_at: iso(w.end),
  });
  const shifts = await admin
    .from("shifts")
    .insert([
      row(aisha, margaretId, MON_4),
      row(aisha, margaretId, SUN_10_LATE),
      row(aisha, margaretId, MON_11_EARLY),
      { ...row(aisha, margaretId, WED_6), cancelled_at: new Date().toISOString() },
      row(daniel, margaretId, TUE_5),
      row(priya, robertId, TUE_5),
    ]);
  if (shifts.error) throw shifts.error;

  return {
    admin,
    orgIds: [banksia!.id, wattle!.id],
    helen,
    aisha,
    daniel,
    priya,
    margaretId,
    robertId,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.aisha, s.daniel, s.priya, s.helen]) {
    await s.admin.auth.admin.deleteUser(user.userId);
  }
  await s.admin.from("clients").delete().in("id", [s.margaretId, s.robertId]);
  await s.admin.from("organisations").delete().in("id", s.orgIds);
}

async function getShifts(
  cookieStore: Map<string, string>,
  carerId: string,
  range: { from: string; to: string },
) {
  return withSession(cookieStore, async () => {
    const { getCarerShifts } = await import("@/server/shifts/queries");
    return getCarerShifts(carerId, range);
  });
}

describe.skipIf(!hasLocalSupabase)("[CAR-05] carer shifts against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[CAR-05][AC-01] Aisha's Monday range returns her Margaret Doyle shift with the full name", async () => {
    const s = await seed();
    try {
      const session = await signedInAs(s.aisha.email);

      const rows = await getShifts(session, s.aisha.userId, {
        from: "2030-03-04",
        to: "2030-03-04",
      });

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        carerId: s.aisha.userId,
        clientId: s.margaretId,
        clientName: "Margaret Doyle",
      });
      expect(iso(rows[0]!.start)).toBe(iso(MON_4.start));
      expect(iso(rows[0]!.end)).toBe(iso(MON_4.end));
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-05][AC-02] the week keeps Sunday 23:30 Melbourne and drops Monday 00:30, earliest first", async () => {
    const s = await seed();
    try {
      const session = await signedInAs(s.aisha.email);

      const rows = await getShifts(session, s.aisha.userId, WEEK);

      expect(rows.map((row) => iso(row.start))).toEqual([iso(MON_4.start), iso(SUN_10_LATE.start)]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-05][AC-03] Daniel's and Priya's shifts never reach Aisha", async () => {
    const s = await seed();
    try {
      const rows = await getShifts(await signedInAs(s.aisha.email), s.aisha.userId, WEEK);
      expect(rows.every((row) => row.carerId === s.aisha.userId)).toBe(true);
      expect(rows.some((row) => row.clientId === s.robertId)).toBe(false);

      const asDaniel = await getShifts(await signedInAs(s.daniel.email), s.daniel.userId, WEEK);
      expect(asDaniel.map((row) => iso(row.start))).toEqual([iso(TUE_5.start)]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-05][AC-04] a cancelled shift is not returned", async () => {
    const s = await seed();
    try {
      const session = await signedInAs(s.aisha.email);

      const rows = await getShifts(session, s.aisha.userId, {
        from: "2030-03-06",
        to: "2030-03-06",
      });

      expect(rows).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-05][AC-05] an ended shift still names its client although RLS hides the client row", async () => {
    const s = await seed();
    try {
      // The last shift with Margaret has ended, so PD-041 (no lookback) ends Aisha's read access.
      await s.admin.from("shifts").delete().eq("carer_id", s.aisha.userId);
      const ended = await s.admin.from("shifts").insert({
        client_id: s.margaretId,
        carer_id: s.aisha.userId,
        starts_at: iso("2020-01-06T08:00:00+11:00"),
        ends_at: iso("2020-01-06T12:00:00+11:00"),
      });
      if (ended.error) throw ended.error;
      const session = await signedInAs(s.aisha.email);

      const { data: visible } = await cookieClient(session)
        .from("clients")
        .select("id")
        .eq("id", s.margaretId);
      expect(visible).toEqual([]);

      const rows = await getShifts(session, s.aisha.userId, {
        from: "2020-01-06",
        to: "2020-01-12",
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.clientName).toBe("Margaret Doyle");
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-05][AC-06] get_carer_shifts answers only for the caller and returns names, not other client data", async () => {
    const s = await seed();
    try {
      const args = (carerId: string) => ({
        p_carer_id: carerId,
        p_from: "2030-03-03T13:00:00Z",
        p_to: "2030-03-10T13:00:00Z",
      });
      const asAisha = cookieClient(await signedInAs(s.aisha.email)) as unknown as RpcClient;
      const asHelen = cookieClient(await signedInAs(s.helen.email)) as unknown as RpcClient;

      const other = await asAisha.rpc("get_carer_shifts", args(s.priya.userId));
      expect(other.data ?? []).toEqual([]);

      const family = await asHelen.rpc("get_carer_shifts", args(s.aisha.userId));
      expect(family.data ?? []).toEqual([]);

      const own = await asAisha.rpc("get_carer_shifts", args(s.aisha.userId));
      expect(own.data!.length).toBeGreaterThan(0);
      expect(Object.keys(own.data![0]!).sort()).toEqual([
        "carer_id",
        "client_first_name",
        "client_id",
        "client_last_name",
        "ends_at",
        "id",
        "starts_at",
      ]);
    } finally {
      await cleanUp(s);
    }
  });
});
