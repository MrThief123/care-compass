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
  return `adm-01-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  lastName: string,
  role: "family" | "carer" | "admin",
  organisationId: string | null,
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
    is_active: isActive,
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

function isoDaysFromNow(days: number, hour = 9): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

/**
 * One organisation (Priya admin, Margaret client, Aisha carer + Dan carer inactive) with an overdue
 * task (Wound dressing check, yesterday, Aisha's shift covers it) and an upcoming shift tomorrow.
 * A second organisation (Rita admin, Robert client, overdue task of its own) is seeded purely so
 * AC-03's RLS/org-scoping has something real to exclude.
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
  // Inactive: must not count toward Staff (AC-01).
  const dan = await createUser("Dan", "Lee", "carer", orgA.data.id, false);
  const rita = await createUser("Rita", "Cole", "admin", orgB.data.id);
  const bob = await createUser("Bob", "Diaz", "carer", orgB.data.id);

  const margaret = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: orgA.data.id })
    .select("id")
    .single();
  const robert = await admin
    .from("clients")
    .insert({ first_name: "Robert", last_name: unique("client"), organisation_id: orgB.data.id })
    .select("id")
    .single();
  if (margaret.error || !margaret.data || robert.error || !robert.data) throw new Error("clients");
  const clientId = margaret.data.id;
  const otherClientId = robert.data.id;

  // Aisha's shift covers the overdue task's start, so it derives her as the assignee (PD-055).
  const shiftYesterday = isoDaysFromNow(-1, 8);
  const shiftYesterdayEnd = isoDaysFromNow(-1, 12);
  await admin.from("shifts").insert({
    client_id: clientId,
    carer_id: aisha.userId,
    starts_at: shiftYesterday,
    ends_at: shiftYesterdayEnd,
  });

  // A one-off task, due yesterday with no completion, is overdue by construction (F0-11).
  const overdueStart = isoDaysFromNow(-1, 9);
  await admin.from("care_events").insert({
    client_id: clientId,
    title: "Wound dressing check",
    starts_at: overdueStart,
    duration_minutes: 30,
    completion_mode: "manual",
  });
  await admin.from("care_events").insert({
    client_id: otherClientId,
    title: "Medication review",
    starts_at: overdueStart,
    duration_minutes: 30,
    completion_mode: "manual",
  });

  // An upcoming shift tomorrow, org A only.
  const upcomingStart = isoDaysFromNow(1, 9);
  const upcomingEnd = isoDaysFromNow(1, 11);
  const upcoming = await admin
    .from("shifts")
    .insert({
      client_id: clientId,
      carer_id: aisha.userId,
      starts_at: upcomingStart,
      ends_at: upcomingEnd,
    })
    .select("id")
    .single();
  if (upcoming.error || !upcoming.data) throw new Error("upcoming shift");

  // A cancelled future shift and a past shift, org A: must not appear in upcomingShifts (AC-05).
  const cancelled = await admin
    .from("shifts")
    .insert({
      client_id: clientId,
      carer_id: aisha.userId,
      starts_at: isoDaysFromNow(2, 9),
      ends_at: isoDaysFromNow(2, 11),
    })
    .select("id")
    .single();
  if (cancelled.error || !cancelled.data) throw new Error("cancelled shift");
  await admin
    .from("shifts")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", cancelled.data.id);
  await admin.from("shifts").insert({
    client_id: clientId,
    carer_id: aisha.userId,
    starts_at: isoDaysFromNow(-3, 9),
    ends_at: isoDaysFromNow(-3, 11),
  });

  // An upcoming shift in org B: must not appear in Priya's list (AC-05/AC-03).
  await admin.from("shifts").insert({
    client_id: otherClientId,
    carer_id: bob.userId,
    starts_at: isoDaysFromNow(1, 9),
    ends_at: isoDaysFromNow(1, 11),
  });

  return {
    admin,
    orgAId: orgA.data.id,
    orgBId: orgB.data.id,
    priya,
    aisha,
    dan,
    rita,
    bob,
    clientId,
    otherClientId,
    upcomingShiftId: upcoming.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.priya, s.aisha, s.dan, s.rita, s.bob]) {
    await s.admin.auth.admin.deleteUser(user.userId);
  }
  await s.admin.from("care_events").delete().in("client_id", [s.clientId, s.otherClientId]);
  await s.admin.from("shifts").delete().in("client_id", [s.clientId, s.otherClientId]);
  await s.admin.from("clients").delete().in("id", [s.clientId, s.otherClientId]);
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

async function adminHomeAs(session: Map<string, string>) {
  return withSession(session, async () => {
    const { getAdminHome } = await import("@/server/admin/queries");
    return getAdminHome();
  });
}

describe.skipIf(!hasLocalSupabase)("[ADM-01] Admin Home against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[ADM-01][AC-01] T-01 Clients is the organisation's client count, Staff the active-carer count", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const data = await adminHomeAs(cookieStore);

      expect(data.clientCount).toBe(1);
      expect(data.staffCount).toBe(1);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-01][AC-02] T-02 an overdue task shows the client's and carer's full names and is marked overdue", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const data = await adminHomeAs(cookieStore);

      expect(data.overdue).toContainEqual(
        expect.objectContaining({
          clientName: expect.stringContaining("Margaret"),
          eventTitle: "Wound dressing check",
          nurseName: "Aisha Rahman",
        }),
      );
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-01][AC-03] T-03 another organisation's clients, staff and overdue events are never included", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const data = await adminHomeAs(cookieStore);

      expect(data.clientCount).toBe(1);
      expect(data.staffCount).toBe(1);
      expect(data.overdue.some((row) => row.eventTitle === "Medication review")).toBe(false);
      expect(data.upcomingShifts.some((row) => row.carerName === "Bob Diaz")).toBe(false);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-01][AC-05] T-05 upcoming shifts lists the organisation's future, uncancelled shifts ordered by start", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const data = await adminHomeAs(cookieStore);

      expect(data.upcomingShifts).toHaveLength(1);
      expect(data.upcomingShifts[0]).toMatchObject({
        id: s.upcomingShiftId,
        clientName: expect.stringContaining("Margaret"),
        carerName: "Aisha Rahman",
      });
      expect(data.upcomingShifts[0]!.date).toMatch(/^[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2,}$/);
      expect(data.upcomingShifts[0]!.time).toMatch(/^\d{2}:\d{2}–\d{2}:\d{2}$/);
    } finally {
      await cleanUp(s);
    }
  });
});
