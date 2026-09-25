// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied).
// These tests create, change and delete organisations, users, clients and shifts, and
// they need this feature's migration, so they run only when NEXT_PUBLIC_SUPABASE_URL is
// a local address and skip against a hosted project. If `.env.local` points at a hosted
// project, override the three variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;

function unique(label: string) {
  return `fam-13-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

/** Two organisations, a family member with a client at the first, and a carer with 2 future shifts, 1 finished shift and an active assignment. */
async function seed() {
  const admin = createAdminClient();
  const orgs = await admin
    .from("organisations")
    .insert([{ name: unique("banksia") }, { name: unique("wattle") }])
    .select("id, name");
  if (orgs.error || orgs.data?.length !== 2) throw orgs.error ?? new Error("orgs");
  const [banksia, wattle] = orgs.data;

  const helen = await createUser("helen", "family", null);
  const aisha = await createUser("aisha", "carer", banksia!.id);

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: "Test", organisation_id: banksia!.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  const clientId = client.data.id;

  const link = await admin
    .from("client_family_members")
    .insert({ client_id: clientId, profile_id: helen.userId });
  if (link.error) throw link.error;

  const assignment = await admin.from("carer_client_assignments").insert({
    carer_id: aisha.userId,
    client_id: clientId,
    organisation_id: banksia!.id,
    started_at: new Date(Date.now() - 2 * HOUR).toISOString(),
  });
  if (assignment.error) throw assignment.error;

  const at = (offsetHours: number) => new Date(Date.now() + offsetHours * HOUR).toISOString();
  const shifts = await admin.from("shifts").insert([
    { client_id: clientId, carer_id: aisha.userId, starts_at: at(24), ends_at: at(28) },
    { client_id: clientId, carer_id: aisha.userId, starts_at: at(48), ends_at: at(52) },
    { client_id: clientId, carer_id: aisha.userId, starts_at: at(-48), ends_at: at(-44) },
  ]);
  if (shifts.error) throw shifts.error;

  return { admin, banksia: banksia!, wattle: wattle!, helen, aisha, clientId };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.auth.admin.deleteUser(s.aisha.userId);
  await s.admin.auth.admin.deleteUser(s.helen.userId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().in("id", [s.banksia.id, s.wattle.id]);
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

describe.skipIf(!hasLocalSupabase)("[FAM-13] change organisation against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[FAM-13][AC-01] Helen lists the organisations, changes Margaret's, and the database reflects it", async () => {
    const s = await seed();
    try {
      const session = await signedInAs(s.helen.email);

      const choices = await withSession(session, async () => {
        const { getOrganisationChoices } = await import("@/server/clients/queries");
        return getOrganisationChoices(s.clientId);
      });
      expect(choices).toEqual(
        expect.arrayContaining([
          { id: s.banksia.id, name: s.banksia.name, isCurrent: true },
          { id: s.wattle.id, name: s.wattle.name, isCurrent: false },
        ]),
      );

      const result = await withSession(session, async () => {
        const { changeClientOrganisation } = await import("@/server/clients/actions");
        return changeClientOrganisation(s.clientId, s.wattle.id);
      });
      expect(result).toEqual({ ok: true, data: undefined });

      const { data: client } = await s.admin
        .from("clients")
        .select("organisation_id")
        .eq("id", s.clientId)
        .single();
      expect(client?.organisation_id).toBe(s.wattle.id);

      const { data: shifts } = await s.admin
        .from("shifts")
        .select("starts_at, cancelled_at")
        .eq("client_id", s.clientId);
      const future = shifts!.filter((shift) => new Date(shift.starts_at) > new Date());
      const past = shifts!.filter((shift) => new Date(shift.starts_at) <= new Date());
      expect(future).toHaveLength(2);
      expect(future.every((shift) => shift.cancelled_at !== null)).toBe(true);
      expect(past).toHaveLength(1);
      expect(past[0]!.cancelled_at).toBeNull();

      const { data: assignments } = await s.admin
        .from("carer_client_assignments")
        .select("ended_at, organisation_id")
        .eq("client_id", s.clientId);
      expect(assignments).toHaveLength(1);
      expect(assignments![0]!.ended_at).not.toBeNull();
      expect(assignments![0]!.organisation_id).toBe(s.banksia.id);

      // Nothing was deleted: the family link is still there (AC-03).
      const { count } = await s.admin
        .from("client_family_members")
        .select("*", { count: "exact", head: true })
        .eq("client_id", s.clientId);
      expect(count).toBe(1);
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-13][AC-06] a carer cannot change the organisation, or list the choices, and nothing changes", async () => {
    const s = await seed();
    try {
      const session = await signedInAs(s.aisha.email);

      const result = await withSession(session, async () => {
        const { changeClientOrganisation } = await import("@/server/clients/actions");
        return changeClientOrganisation(s.clientId, s.wattle.id);
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");

      await expect(
        withSession(session, async () => {
          const { getOrganisationChoices } = await import("@/server/clients/queries");
          return getOrganisationChoices(s.clientId);
        }),
      ).rejects.toThrow("could not load organisations");

      const { data: client } = await s.admin
        .from("clients")
        .select("organisation_id")
        .eq("id", s.clientId)
        .single();
      expect(client?.organisation_id).toBe(s.banksia.id);
      const { count } = await s.admin
        .from("shifts")
        .select("*", { count: "exact", head: true })
        .eq("client_id", s.clientId)
        .not("cancelled_at", "is", null);
      expect(count).toBe(0);
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-13][AC-01] changing to the organisation she is already with is refused and changes nothing", async () => {
    const s = await seed();
    try {
      const session = await signedInAs(s.helen.email);

      const result = await withSession(session, async () => {
        const { changeClientOrganisation } = await import("@/server/clients/actions");
        return changeClientOrganisation(s.clientId, s.banksia.id);
      });

      expect(result.ok).toBe(false);
      const { count } = await s.admin
        .from("shifts")
        .select("*", { count: "exact", head: true })
        .eq("client_id", s.clientId)
        .not("cancelled_at", "is", null);
      expect(count).toBe(0);
    } finally {
      await cleanUp(s);
    }
  });
});
