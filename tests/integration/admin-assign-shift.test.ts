// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import type { AssignShiftInput } from "@/server/admin/manage-actions";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// [ADM-07] Requires a running local Supabase stack (`supabase start`, migrations applied). Skips
// against a hosted project, as tests/integration/admin-manage-selection.test.ts does. Each test
// seeds its own organisations, people and shifts, and removes them afterwards.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `adm-07-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
 * Banksia (A): Priya (admin), Aisha (carer), Margaret and Robert (clients); Aisha already has
 * Robert on 1 Dec 2026 11:30-13:00 Melbourne. Elsewhere (B): Olga (admin), Bea (carer), Otto (client).
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
  const olga = await createUser("Olga", "Other", "admin", orgB.data.id);
  const bea = await createUser("Bea", "Other", "carer", orgB.data.id);

  const clients = await admin
    .from("clients")
    .insert([
      { first_name: "Margaret", last_name: "Doyle", organisation_id: orgA.data.id },
      { first_name: "Robert", last_name: "Hale", organisation_id: orgA.data.id },
      { first_name: "Otto", last_name: "Elsewhere", organisation_id: orgB.data.id },
    ])
    .select("id, first_name");
  if (clients.error || !clients.data) throw new Error("clients");
  const idOf = (name: string) => clients.data.find((row) => row.first_name === name)!.id;

  const existing = await admin
    .from("shifts")
    .insert({
      organisation_id: orgA.data.id,
      client_id: idOf("Robert"),
      carer_id: aisha.userId,
      // 1 Dec 2026 11:30-13:00 AEDT.
      starts_at: "2026-12-01T00:30:00Z",
      ends_at: "2026-12-01T02:00:00Z",
    })
    .select("id")
    .single();
  if (existing.error || !existing.data) throw existing.error ?? new Error("shift");

  return {
    admin,
    orgAId: orgA.data.id,
    orgBId: orgB.data.id,
    priya,
    aisha,
    olga,
    bea,
    margaretId: idOf("Margaret"),
    robertId: idOf("Robert"),
    ottoId: idOf("Otto"),
    existingShiftId: existing.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.from("clients").delete().in("id", [s.margaretId, s.robertId, s.ottoId]);
  for (const person of [s.priya, s.aisha, s.olga, s.bea]) {
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

const assignAs = (session: Map<string, string>, input: AssignShiftInput) =>
  withSession(session, async () => {
    const { assignShift } = await import("@/server/admin/manage-actions");
    return assignShift(input);
  });

const manageAs = (session: Map<string, string>) =>
  withSession(session, async () => {
    const { getAdminManage } = await import("@/server/admin/manage-queries");
    return getAdminManage();
  });

async function shiftsFor(s: Awaited<ReturnType<typeof seed>>, clientId: string) {
  const { data, error } = await s.admin
    .from("shifts")
    .select("carer_id, client_id, organisation_id, starts_at, ends_at, created_by")
    .eq("client_id", clientId);
  if (error) throw error;
  return data;
}

describe.skipIf(!hasLocalSupabase)("[ADM-07] Assign shift against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[ADM-07][AC-01] Priya assigns Aisha to Margaret on 1 Dec 07:00-11:00: the shift exists and 1 Dec has a dot", async () => {
    const s = await seed();
    try {
      const session = await signIn(s.priya.email);
      const result = await assignAs(session, {
        carerId: s.aisha.userId,
        clientId: s.margaretId,
        date: "2026-12-01",
        start: "07:00",
        end: "11:00",
      });
      expect(result.ok).toBe(true);

      const rows = await shiftsFor(s, s.margaretId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        carer_id: s.aisha.userId,
        organisation_id: s.orgAId,
        created_by: s.priya.userId,
      });
      expect(new Date(rows[0]!.starts_at).toISOString()).toBe("2026-11-30T20:00:00.000Z");
      expect(new Date(rows[0]!.ends_at).toISOString()).toBe("2026-12-01T00:00:00.000Z");

      // The Manage data the date picker's dots come from now has the shift on 1 Dec.
      const data = await manageAs(session);
      expect(data.shifts).toContainEqual(
        expect.objectContaining({
          staffId: s.aisha.userId,
          clientId: s.margaretId,
          date: "2026-12-01",
          start: "07:00",
          end: "11:00",
          clientName: "Margaret Doyle",
        }),
      );
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-07][AC-02] the existing 11:30-13:00 shift with Robert is loaded with names, and an overlapping assignment is not blocked", async () => {
    const s = await seed();
    try {
      const session = await signIn(s.priya.email);
      const data = await manageAs(session);
      expect(data.shifts).toContainEqual({
        id: s.existingShiftId,
        staffId: s.aisha.userId,
        clientId: s.robertId,
        date: "2026-12-01",
        start: "11:30",
        end: "13:00",
        staffName: "Aisha Rahman",
        clientName: "Robert Hale",
      });

      // The same shift is what F0-10's overlapping_shifts reports for 11:00-15:00 that day.
      const { data: overlaps, error } = await s.admin.rpc("overlapping_shifts", {
        p_carer_id: s.aisha.userId,
        p_starts_at: "2026-12-01T00:00:00Z",
        p_ends_at: "2026-12-01T04:00:00Z",
      });
      expect(error).toBeNull();
      expect((overlaps as { id: string }[] | null)?.map((row) => row.id)).toEqual([
        s.existingShiftId,
      ]);

      const result = await assignAs(session, {
        carerId: s.aisha.userId,
        clientId: s.margaretId,
        date: "2026-12-01",
        start: "11:00",
        end: "15:00",
      });
      expect(result.ok).toBe(true);
      expect(await shiftsFor(s, s.margaretId)).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-07][AC-03] an end before the start is refused and nothing is stored", async () => {
    const s = await seed();
    try {
      const session = await signIn(s.priya.email);
      const result = await assignAs(session, {
        carerId: s.aisha.userId,
        clientId: s.margaretId,
        date: "2026-12-01",
        start: "12:00",
        end: "10:00",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION");
      expect(await shiftsFor(s, s.margaretId)).toHaveLength(0);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-07] RLS: an admin of another organisation cannot assign Banksia's carer to Banksia's client", async () => {
    const s = await seed();
    try {
      const session = await signIn(s.olga.email);
      const result = await assignAs(session, {
        carerId: s.aisha.userId,
        clientId: s.margaretId,
        date: "2026-12-01",
        start: "07:00",
        end: "11:00",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("UNAUTHORISED");
      expect(await shiftsFor(s, s.margaretId)).toHaveLength(0);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-07] the admin must also be the carer's admin: another organisation's carer cannot be assigned", async () => {
    const s = await seed();
    try {
      const session = await signIn(s.priya.email);
      const result = await assignAs(session, {
        carerId: s.bea.userId,
        clientId: s.margaretId,
        date: "2026-12-01",
        start: "07:00",
        end: "11:00",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("UNAUTHORISED");
      expect(await shiftsFor(s, s.margaretId)).toHaveLength(0);

      // Nor can Priya put her own carer on another organisation's client.
      const other = await assignAs(session, {
        carerId: s.aisha.userId,
        clientId: s.ottoId,
        date: "2026-12-01",
        start: "07:00",
        end: "11:00",
      });
      expect(other.ok).toBe(false);
      expect(await shiftsFor(s, s.ottoId)).toHaveLength(0);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-07] RLS: another organisation's admin sees none of Banksia's shifts on Manage", async () => {
    const s = await seed();
    try {
      const session = await signIn(s.olga.email);
      const data = await manageAs(session);
      expect(data.shifts.map((shift) => shift.id)).not.toContain(s.existingShiftId);
    } finally {
      await cleanUp(s);
    }
  });
});
