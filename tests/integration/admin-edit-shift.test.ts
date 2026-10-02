// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { localToMelbourneIso, melbourneDateKey } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpIfAdmin } from "../helpers/aal2";

// [ADM-09] Cancel only (editing a shift was dropped, CHG-053). Requires a running local Supabase stack (`supabase start`, migrations applied). Skips
// against a hosted project, like tests/integration/admin-assign-shift.test.ts. Each test seeds its
// own organisations, people and shifts, and removes them afterwards.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;

function unique(label: string) {
  return `adm-09-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A Melbourne calendar date ten days from now, so the shifts made on it are always in the future. */
const FUTURE_DATE = melbourneDateKey(new Date(Date.now() + 10 * 24 * HOUR).toISOString());
const at = (time: string) => new Date(localToMelbourneIso(`${FUTURE_DATE}T${time}`)).toISOString();

async function createUser(
  firstName: string,
  lastName: string,
  role: "carer" | "admin",
  organisationId: string,
  isActive = true,
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
    is_active: isActive,
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/**
 * Banksia (A): Priya (admin), Aisha and Daniel (carers), Dean (deactivated carer), Margaret. Aisha
 * has Margaret 07:00-11:00 on FUTURE_DATE (`futureId`), 12:00-14:00 the same day
 * (`laterId`), and an ended shift yesterday-ish (`endedId`: 5 to 3 hours ago).
 * Elsewhere (B): Olga (admin), Bea (carer).
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
  const dean = await createUser("Dean", "Inactive", "carer", orgA.data.id, false);
  const olga = await createUser("Olga", "Other", "admin", orgB.data.id);
  const bea = await createUser("Bea", "Other", "carer", orgB.data.id);

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: "Doyle", organisation_id: orgA.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw new Error("client");

  const shifts = await admin
    .from("shifts")
    .insert([
      {
        organisation_id: orgA.data.id,
        client_id: client.data.id,
        carer_id: aisha.userId,
        starts_at: at("07:00"),
        ends_at: at("11:00"),
      },
      {
        organisation_id: orgA.data.id,
        client_id: client.data.id,
        carer_id: aisha.userId,
        starts_at: at("12:00"),
        ends_at: at("14:00"),
      },
      {
        organisation_id: orgA.data.id,
        client_id: client.data.id,
        carer_id: aisha.userId,
        starts_at: new Date(Date.now() - 5 * HOUR).toISOString(),
        ends_at: new Date(Date.now() - 3 * HOUR).toISOString(),
      },
    ])
    .select("id, starts_at")
    .order("starts_at");
  if (shifts.error || shifts.data?.length !== 3) throw shifts.error ?? new Error("shifts");
  // Ordered by start: the ended one first, then 07:00, then 12:00 on FUTURE_DATE.
  const [endedId, futureId, laterId] = shifts.data.map((row) => row.id) as [string, string, string];

  return {
    admin,
    orgAId: orgA.data.id,
    orgBId: orgB.data.id,
    priya,
    aisha,
    daniel,
    dean,
    olga,
    bea,
    clientId: client.data.id,
    endedId,
    futureId,
    laterId,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.from("clients").delete().eq("id", s.clientId);
  for (const person of [s.priya, s.aisha, s.daniel, s.dean, s.olga, s.bea]) {
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

const cancelAs = (session: Map<string, string>, shiftId: string) =>
  withSession(session, async () => {
    const { cancelShift } = await import("@/server/admin/manage-actions");
    return cancelShift(shiftId);
  });
const manageAs = (session: Map<string, string>) =>
  withSession(session, async () => {
    const { getAdminManage } = await import("@/server/admin/manage-queries");
    return getAdminManage();
  });

async function row(s: Awaited<ReturnType<typeof seed>>, id: string) {
  const { data, error } = await s.admin
    .from("shifts")
    .select("carer_id, starts_at, ends_at, cancelled_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

describe.skipIf(!hasLocalSupabase)(
  "[ADM-09] Edit, extend or cancel a shift against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[ADM-09][AC-07] a shift that has ended is NOT_FOUND to cancel, is unchanged, and Manage marks it not editable", async () => {
      const s = await seed();
      try {
        const session = await signIn(s.priya.email);
        const before = await row(s, s.endedId);

        expect(await cancelAs(session, s.endedId)).toMatchObject({
          ok: false,
          error: { code: "NOT_FOUND" },
        });
        expect(await row(s, s.endedId)).toEqual(before);

        const data = await manageAs(session);
        expect(data.shifts.find((shift) => shift.id === s.endedId)).toMatchObject({
          editable: false,
        });
        expect(data.shifts.find((shift) => shift.id === s.futureId)).toMatchObject({
          editable: true,
        });
      } finally {
        await cleanUp(s);
      }
    });

    it("[ADM-09][AC-07] another organisation's admin gets NOT_FOUND and changes nothing", async () => {
      const s = await seed();
      try {
        const session = await signIn(s.olga.email);
        const before = await row(s, s.futureId);

        expect(await cancelAs(session, s.futureId)).toMatchObject({
          ok: false,
          error: { code: "NOT_FOUND" },
        });
        expect(await row(s, s.futureId)).toEqual(before);
      } finally {
        await cleanUp(s);
      }
    });

    it("[ADM-09][AC-07] cancelling sets cancelled_at, keeps the row, drops it from Manage, and a second cancel is NOT_FOUND", async () => {
      const s = await seed();
      try {
        const session = await signIn(s.priya.email);
        expect(await cancelAs(session, s.futureId)).toEqual({ ok: true, data: { id: s.futureId } });

        const stored = await row(s, s.futureId);
        expect(stored.cancelled_at).not.toBeNull();
        expect(new Date(stored.starts_at).toISOString()).toBe(at("07:00"));

        const data = await manageAs(session);
        expect(data.shifts.map((shift) => shift.id)).not.toContain(s.futureId);
        expect(data.shifts.map((shift) => shift.id)).toContain(s.laterId);

        expect(await cancelAs(session, s.futureId)).toMatchObject({
          ok: false,
          error: { code: "NOT_FOUND" },
        });
      } finally {
        await cleanUp(s);
      }
    });
  },
);
