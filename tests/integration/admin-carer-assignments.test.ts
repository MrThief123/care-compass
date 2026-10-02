// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpIfAdmin } from "../helpers/aal2";

// [ADM-08] Requires a running local Supabase stack (`supabase start`, migrations applied). Skips
// against a hosted project, as tests/integration/admin-assign-shift.test.ts does. Each test seeds
// its own organisations, people and shifts, and removes them afterwards.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

function unique(label: string) {
  return `adm-08-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  lastName: string,
  role: "carer" | "admin",
  organisationId: string,
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
 * Banksia (A): Priya (admin), Aisha and Daniel (carers), Margaret and Elsie (clients).
 *   Aisha–Margaret: 2 future shifts, 1 in progress, 1 finished (history).
 *   Aisha–Elsie: 1 future shift.  Daniel–Margaret: 1 future shift.  A cancelled Aisha–Elsie shift
 *   that must not count as an assignment.
 * Elsewhere (B): Olga (admin), Bea (carer), Otto (client).
 */
async function seed() {
  const admin = createAdminClient();
  const orgA = await admin
    .from("organisations")
    .insert({ name: unique("org-a") })
    .select("id")
    .single();
  const orgB = await admin
    .from("organisations")
    .insert({ name: unique("org-b") })
    .select("id")
    .single();
  if (orgA.error || !orgA.data || orgB.error || !orgB.data) throw new Error("orgs");

  const priya = await createUser("Priya", "Nair", "admin", orgA.data.id);
  const aisha = await createUser("Aisha", "Rahman", "carer", orgA.data.id);
  const daniel = await createUser("Daniel", "Kelly", "carer", orgA.data.id);
  const olga = await createUser("Olga", "Other", "admin", orgB.data.id);
  const bea = await createUser("Bea", "Other", "carer", orgB.data.id);

  const clients = await admin
    .from("clients")
    .insert([
      { first_name: "Margaret", last_name: "Doyle", organisation_id: orgA.data.id },
      { first_name: "Elsie", last_name: "Marsh", organisation_id: orgA.data.id },
      { first_name: "Otto", last_name: "Elsewhere", organisation_id: orgB.data.id },
    ])
    .select("id, first_name");
  if (clients.error || !clients.data) throw new Error("clients");
  const idOf = (name: string) => clients.data.find((row) => row.first_name === name)!.id;

  const shift = (
    carerId: string,
    clientId: string,
    startMs: number,
    endMs: number,
    cancelled = false,
  ) => ({
    organisation_id: orgA.data!.id,
    carer_id: carerId,
    client_id: clientId,
    starts_at: iso(startMs),
    ends_at: iso(endMs),
    ...(cancelled && { cancelled_at: iso(-HOUR) }),
  });
  const inserted = await admin
    .from("shifts")
    .insert([
      shift(aisha.userId, idOf("Margaret"), 24 * HOUR, 28 * HOUR),
      shift(aisha.userId, idOf("Margaret"), 48 * HOUR, 52 * HOUR),
      shift(aisha.userId, idOf("Margaret"), -1 * HOUR, 1 * HOUR),
      shift(aisha.userId, idOf("Margaret"), -48 * HOUR, -44 * HOUR),
      shift(aisha.userId, idOf("Elsie"), 24 * HOUR, 28 * HOUR),
      shift(aisha.userId, idOf("Elsie"), 72 * HOUR, 76 * HOUR, true),
      shift(daniel.userId, idOf("Margaret"), 24 * HOUR, 28 * HOUR),
    ]);
  if (inserted.error) throw inserted.error;

  return {
    admin,
    orgAId: orgA.data.id,
    orgBId: orgB.data.id,
    priya,
    aisha,
    daniel,
    olga,
    bea,
    margaretId: idOf("Margaret"),
    elsieId: idOf("Elsie"),
    ottoId: idOf("Otto"),
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.from("clients").delete().in("id", [s.margaretId, s.elsieId, s.ottoId]);
  for (const person of [s.priya, s.aisha, s.daniel, s.olga, s.bea]) {
    await s.admin.auth.admin.deleteUser(person.userId);
  }
  await s.admin.from("organisations").delete().in("id", [s.orgAId, s.orgBId]);
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
  // Admin authority in RLS needs an AAL2 session (F0-21); family and carers are never stepped up.
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

const removeAs = (session: Map<string, string>, carerId: string, clientId: string) =>
  withSession(session, async () => {
    const { removeCarerAssignment } = await import("@/server/admin/assignments-actions");
    return removeCarerAssignment({ carerId, clientId });
  });

const assignmentsAs = (session: Map<string, string>) =>
  withSession(session, async () => {
    const { getCarerAssignments } = await import("@/server/admin/assignments-queries");
    return getCarerAssignments();
  });

/** What a carer can read of a client, under their own session (RLS, not the service role). */
async function clientRowsAs(email: string, clientId: string) {
  const client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  expect(error).toBeNull();
  const { data, error: readError } = await client.from("clients").select("id").eq("id", clientId);
  expect(readError).toBeNull();
  return data ?? [];
}

describe.skipIf(!hasLocalSupabase)(
  "[ADM-08] Carer-client assignments against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[ADM-08][AC-04] Priya's assignments list names each carer's clients; cancelled and finished shifts don't make an assignment", async () => {
      const s = await seed();
      try {
        const session = await signIn(s.priya.email);
        const { assignments } = await assignmentsAs(session);

        const aisha = assignments.filter((row) => row.carerId === s.aisha.userId);
        expect(aisha.map((row) => row.clientName).sort()).toEqual([
          "Elsie Marsh",
          "Margaret Doyle",
        ]);
        // Margaret: the in-progress shift and two future ones; the finished shift is history.
        expect(aisha.find((row) => row.clientId === s.margaretId)?.shiftCount).toBe(3);
        // Elsie: one future shift; the cancelled one does not count.
        expect(aisha.find((row) => row.clientId === s.elsieId)?.shiftCount).toBe(1);
        expect(assignments.filter((row) => row.carerId === s.daniel.userId)).toHaveLength(1);
        // Nobody from the other organisation.
        expect(assignments.some((row) => row.carerId === s.bea.userId)).toBe(false);
      } finally {
        await cleanUp(s);
      }
    });

    it("[ADM-08][AC-01] after Priya removes Aisha from Elsie, Aisha reads zero rows for Elsie", async () => {
      const s = await seed();
      try {
        expect(await clientRowsAs(s.aisha.email, s.elsieId)).toHaveLength(1);

        const session = await signIn(s.priya.email);
        const result = await removeAs(session, s.aisha.userId, s.elsieId);
        expect(result).toEqual({ ok: true, data: { endedShifts: 1 } });

        expect(await clientRowsAs(s.aisha.email, s.elsieId)).toHaveLength(0);
        // The list no longer shows the pair.
        const { assignments } = await assignmentsAs(session);
        expect(
          assignments.some((row) => row.carerId === s.aisha.userId && row.clientId === s.elsieId),
        ).toBe(false);
      } finally {
        await cleanUp(s);
      }
    });

    it("[ADM-08][AC-02] removal cancels future shifts, ends the one in progress, keeps history and other pairs", async () => {
      const s = await seed();
      try {
        const session = await signIn(s.priya.email);
        const result = await removeAs(session, s.aisha.userId, s.margaretId);
        expect(result).toEqual({ ok: true, data: { endedShifts: 3 } });

        const { data: rows, error } = await s.admin
          .from("shifts")
          .select("carer_id, client_id, starts_at, ends_at, cancelled_at")
          .in("client_id", [s.margaretId, s.elsieId]);
        expect(error).toBeNull();
        const pair = rows!.filter(
          (r) => r.carer_id === s.aisha.userId && r.client_id === s.margaretId,
        );
        expect(pair).toHaveLength(4); // nothing deleted
        const now = Date.now();
        const future = pair.filter((r) => new Date(r.starts_at).getTime() > now);
        expect(future).toHaveLength(2);
        expect(future.every((r) => r.cancelled_at !== null)).toBe(true);
        const current = pair.find(
          (r) =>
            new Date(r.starts_at).getTime() < now &&
            new Date(r.starts_at).getTime() > now - 2 * HOUR,
        );
        expect(current?.cancelled_at).toBeNull();
        expect(new Date(current!.ends_at).getTime()).toBeLessThanOrEqual(Date.now());
        const finished = pair.find((r) => new Date(r.ends_at).getTime() < now - 40 * HOUR);
        expect(finished?.cancelled_at).toBeNull();

        // Other pairs untouched: Aisha–Elsie still active, Daniel–Margaret still active.
        expect(await clientRowsAs(s.aisha.email, s.elsieId)).toHaveLength(1);
        expect(await clientRowsAs(s.daniel.email, s.margaretId)).toHaveLength(1);
        expect(await clientRowsAs(s.aisha.email, s.margaretId)).toHaveLength(0);
      } finally {
        await cleanUp(s);
      }
    });

    it("[ADM-08][AC-03] another organisation's admin is refused and changes nothing", async () => {
      const s = await seed();
      try {
        const session = await signIn(s.olga.email);
        const result = await removeAs(session, s.aisha.userId, s.margaretId);
        expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHORISED" } });
        expect(await clientRowsAs(s.aisha.email, s.margaretId)).toHaveLength(1);

        // Nor can she see Banksia's assignments.
        const { assignments } = await assignmentsAs(session);
        expect(assignments.some((row) => row.carerId === s.aisha.userId)).toBe(false);
      } finally {
        await cleanUp(s);
      }
    });

    it("[ADM-08][AC-03] Priya can't end an assignment for a carer from another organisation, and a carer can't end their own", async () => {
      const s = await seed();
      try {
        const priya = await signIn(s.priya.email);
        expect(await removeAs(priya, s.bea.userId, s.margaretId)).toMatchObject({
          ok: false,
          error: { code: "UNAUTHORISED" },
        });
        const aisha = await signIn(s.aisha.email);
        expect(await removeAs(aisha, s.aisha.userId, s.margaretId)).toMatchObject({
          ok: false,
          error: { code: "UNAUTHORISED" },
        });
        expect(await clientRowsAs(s.aisha.email, s.margaretId)).toHaveLength(1);
      } finally {
        await cleanUp(s);
      }
    });
  },
);
