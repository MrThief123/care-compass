// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// [CAR-03] getCarerPatients against a real database: the list is whatever RLS lets the carer read
// (PD-041, F0-18), so no new migration. Needs a running local Supabase stack (`supabase start`,
// migrations applied); runs only when NEXT_PUBLIC_SUPABASE_URL is a local address and skips
// against a hosted project. If `.env.local` points at a hosted project, override the three
// variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function unique(label: string) {
  return `car-03-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

/** A date of birth that makes the client `years` old today and for the next ten months. */
function dobForAge(years: number) {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCMonth(d.getUTCMonth() - 2);
  return d.toISOString().slice(0, 10);
}

const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

/**
 * Banksia holds Aisha and Daniel and eight clients; Wattle holds Priya and one. Aisha's shifts:
 * Margaret now (started an hour ago), then Robert, Elsie, Frank, Doris, Harold and Jean on the
 * next six days, plus Ruth (ended), Cara (cancelled). Walter (same organisation) has no shift with
 * her; Olive (Wattle) is Priya's; Daniel has one with Walter.
 */
const PATIENTS = [
  ["Margaret", "Doyle", 78, "Preston VIC"],
  ["Robert", "Hale", 82, "Reservoir VIC"],
  ["Elsie", "Marsh", 90, "Thornbury VIC"],
  ["Frank", "Novak", 76, "Northcote VIC"],
  ["Doris", "Petrov", 85, "Preston VIC"],
  ["Harold", "Byrne", 79, "Coburg VIC"],
  ["Jean", "Ahmed", 88, "Fairfield VIC"],
] as const;

async function seed() {
  const admin = createAdminClient();
  const orgs = await admin
    .from("organisations")
    .insert([{ name: unique("banksia") }, { name: unique("wattle") }])
    .select("id");
  if (orgs.error || orgs.data?.length !== 2) throw orgs.error ?? new Error("orgs");
  const [banksia, wattle] = orgs.data;

  const aisha = await createUser("aisha", "carer", banksia!.id);
  const daniel = await createUser("daniel", "carer", banksia!.id);
  const priya = await createUser("priya", "carer", wattle!.id);

  const named = (first: string, last: string, orgId: string, age = 80) => ({
    first_name: first,
    last_name: last,
    organisation_id: orgId,
    date_of_birth: dobForAge(age),
    suburb: "Preston VIC",
  });
  const clients = await admin
    .from("clients")
    .insert([
      ...PATIENTS.map(([first, last, age, suburb]) => ({
        ...named(first, last, banksia!.id, age),
        suburb,
      })),
      named("Ruth", "Ended", banksia!.id),
      named("Cara", "Cancelled", banksia!.id),
      named("Walter", "Quill", banksia!.id),
      named("Olive", "Nash", wattle!.id),
    ])
    .select("id, first_name");
  if (clients.error || clients.data?.length !== 11) throw clients.error ?? new Error("clients");
  const id = (first: string) => clients.data.find((c) => c.first_name === first)!.id;

  const row = (carer: { userId: string }, first: string, start: number, end: number) => ({
    client_id: id(first),
    carer_id: carer.userId,
    starts_at: at(start),
    ends_at: at(end),
  });
  const shifts = await admin
    .from("shifts")
    .insert([
      row(aisha, "Margaret", -HOUR, HOUR),
      ...PATIENTS.slice(1).map(([first], i) =>
        row(aisha, first, (i + 1) * DAY, (i + 1) * DAY + 2 * HOUR),
      ),
      row(aisha, "Ruth", -3 * HOUR, -HOUR),
      { ...row(aisha, "Cara", 2 * DAY, 2 * DAY + HOUR), cancelled_at: new Date().toISOString() },
      row(daniel, "Walter", DAY, DAY + HOUR),
      row(priya, "Olive", DAY, DAY + HOUR),
    ]);
  if (shifts.error) throw shifts.error;

  return { admin, orgIds: [banksia!.id, wattle!.id], aisha, daniel, priya, id, ids: clients.data };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.aisha, s.daniel, s.priya]) {
    await s.admin.auth.admin.deleteUser(user.userId);
  }
  await s.admin
    .from("clients")
    .delete()
    .in(
      "id",
      s.ids.map((c) => c.id),
    );
  await s.admin.from("organisations").delete().in("id", s.orgIds);
}

async function getPatients(cookieStore: Map<string, string>, carerId: string, query?: string) {
  return withSession(cookieStore, async () => {
    const { getCarerPatients } = await import("@/server/shifts/queries");
    return getCarerPatients(carerId, query);
  });
}

describe.skipIf(!hasLocalSupabase)("[CAR-03] carer patients against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[CAR-03][AC-01] Aisha's seven patients, soonest shift first, with full name, age and suburb", async () => {
    const s = await seed();
    try {
      const rows = await getPatients(await signedInAs(s.aisha.email), s.aisha.userId);

      expect(rows.map((row) => [row.name, row.age, row.suburb])).toEqual(
        PATIENTS.map(([first, last, age, suburb]) => [`${first} ${last}`, age, suburb]),
      );
      expect(rows[0]).toMatchObject({ clientId: s.id("Margaret"), firstName: "Margaret" });
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-03][AC-02] 'Els' returns only Elsie Marsh; 'marsh' finds her by last name", async () => {
    const s = await seed();
    try {
      const session = await signedInAs(s.aisha.email);

      const byFirst = await getPatients(session, s.aisha.userId, "Els");
      const byLast = await getPatients(session, s.aisha.userId, " MARSH ");
      const none = await getPatients(session, s.aisha.userId, "zzz");

      expect(byFirst.map((row) => row.name)).toEqual(["Elsie Marsh"]);
      expect(byLast.map((row) => row.name)).toEqual(["Elsie Marsh"]);
      expect(none).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-03][AC-04] a client in Aisha's organisation with no shift with her is absent, and so is another organisation's", async () => {
    const s = await seed();
    try {
      const rows = await getPatients(await signedInAs(s.aisha.email), s.aisha.userId);
      const names = rows.map((row) => row.name);

      expect(names).not.toContain("Walter Quill");
      expect(names).not.toContain("Olive Nash");
      expect(rows.some((row) => row.clientId === s.id("Walter"))).toBe(false);

      const asDaniel = await getPatients(await signedInAs(s.daniel.email), s.daniel.userId);
      expect(asDaniel.map((row) => row.name)).toEqual(["Walter Quill"]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-03][AC-04] a search cannot reach a client the carer may not see", async () => {
    const s = await seed();
    try {
      const rows = await getPatients(await signedInAs(s.aisha.email), s.aisha.userId, "Walter");
      expect(rows).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-03][AC-05] an ended or cancelled shift gives no patient; a future one does, not yet on shift", async () => {
    const s = await seed();
    try {
      const rows = await getPatients(await signedInAs(s.aisha.email), s.aisha.userId);
      const names = rows.map((row) => row.name);

      expect(names).not.toContain("Ruth Ended");
      expect(names).not.toContain("Cara Cancelled");
      expect(rows.find((row) => row.name === "Robert Hale")?.onShift).toBe(false);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-03][AC-05] onShift is true only for the client whose shift is in progress", async () => {
    const s = await seed();
    try {
      const rows = await getPatients(await signedInAs(s.aisha.email), s.aisha.userId);

      expect(rows.filter((row) => row.onShift).map((row) => row.name)).toEqual(["Margaret Doyle"]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-03][AC-05] a client with two shifts is one card, ordered by the soonest", async () => {
    const s = await seed();
    try {
      await s.admin.from("shifts").insert({
        client_id: s.id("Jean"),
        carer_id: s.aisha.userId,
        starts_at: at(12 * HOUR),
        ends_at: at(13 * HOUR),
      });

      const rows = await getPatients(await signedInAs(s.aisha.email), s.aisha.userId);

      expect(rows.filter((row) => row.name === "Jean Ahmed")).toHaveLength(1);
      expect(rows.map((row) => row.name).slice(0, 2)).toEqual(["Margaret Doyle", "Jean Ahmed"]);
    } finally {
      await cleanUp(s);
    }
  });
});
