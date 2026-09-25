// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { melbourneDateKey } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied).
// These tests create users, clients, events, shifts and completions, and they need this
// feature's migration, so they run only when NEXT_PUBLIC_SUPABASE_URL is a local address and
// skip against a hosted project. If `.env.local` points at a hosted project, override the three
// variables from `supabase status -o env` for the run.
//
// Completions are append-only and restrict deleting their client, so a client that got a
// tick-off is left behind (with a unique name) when the test ends; users are always removed.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;

/** The Melbourne calendar date `offsetMs` from now: what the contract's range takes. */
const day = (offsetMs: number) => melbourneDateKey(new Date(Date.now() + offsetMs).toISOString());

/** An occurrence start is a whole second (the database enforces it): `Date.now()` plus an offset, floored. */
const at = (offsetMs: number) =>
  new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000).toISOString();
const DAY = 24 * HOUR;

function unique(label: string) {
  return `f0-11-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  role: "family" | "carer",
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
    last_name: role === "family" ? "Doyle" : "Rahman",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

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
  const aisha = await createUser("Aisha", "carer", org.data.id);

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

  await admin.from("client_family_members").insert([
    { client_id: client.data.id, profile_id: helen.userId },
    { client_id: other.data.id, profile_id: rosa.userId },
  ]);
  await admin.from("carer_client_assignments").insert({
    carer_id: aisha.userId,
    client_id: client.data.id,
    organisation_id: org.data.id,
    started_at: new Date(Date.now() - 3 * DAY).toISOString(),
  });

  return {
    admin,
    orgId: org.data.id,
    helen,
    rosa,
    aisha,
    clientId: client.data.id,
    otherId: other.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa, s.aisha]) await s.admin.auth.admin.deleteUser(user.userId);
  // Clients with history cannot be deleted (append-only completions): leave those, ignore the error.
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

async function occurrencesAs(
  session: Map<string, string>,
  clientId: string,
  range: { from: string; to: string },
  now = new Date(),
) {
  return withSession(session, async () => {
    const { getOccurrences } = await import("@/server/events/queries");
    return getOccurrences(clientId, range, { now });
  });
}

describe.skipIf(!hasLocalSupabase)("[F0-11] care events against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[F0-11][AC-01] a weekly 09:00 'Morning medication' has its occurrence for 30 Nov to 6 Dec 2026, planned", async () => {
    const s = await seed();
    try {
      const { client, cookieStore } = await signIn(s.helen.email);
      const created = await client.from("care_events").insert({
        client_id: s.clientId,
        title: "Morning medication",
        starts_at: "2026-11-30T09:00:00+11:00",
        duration_minutes: 15,
        recurrence: { frequency: "weekly", interval: 1 },
      });
      expect(created.error).toBeNull();

      const occurrences = await occurrencesAs(cookieStore, s.clientId, {
        from: "2026-11-30",
        to: "2026-12-06",
      });

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0]).toMatchObject({
        title: "Morning medication",
        clientId: s.clientId,
        start: "2026-11-30T09:00:00+11:00",
        durationMinutes: 15,
        status: "planned",
      });
      expect(occurrences[0]!.key).toMatch(/^[0-9a-f-]{36}:2026-11-30T09:00:00\+11:00$/);
    } finally {
      await cleanUp(s);
    }
  });

  it("[F0-11][AC-04] a tick-off shows Done with Helen's name; an undo puts it back to Overdue", async () => {
    const s = await seed();
    try {
      const { client, cookieStore } = await signIn(s.helen.email);
      const anchor = at(-2 * DAY);
      const event = await client
        .from("care_events")
        .insert({ client_id: s.clientId, title: "Physio", starts_at: anchor })
        .select("id")
        .single();
      expect(event.error).toBeNull();
      const range = { from: day(-3 * DAY), to: day(DAY) };

      const before = await occurrencesAs(cookieStore, s.clientId, range);
      expect(before).toHaveLength(1);
      expect(before[0]).toMatchObject({ status: "overdue" });

      const tick = await client.rpc("set_occurrence_done", {
        p_event_id: event.data!.id,
        p_original_start: anchor,
      });
      expect(tick.error).toBeNull();
      expect(tick.data).toMatchObject({ actor_id: s.helen.userId, action: "done" });

      const done = await occurrencesAs(cookieStore, s.clientId, range);
      expect(done[0]).toMatchObject({ status: "done", actor: "Helen Doyle" });

      const undo = await client.rpc("set_occurrence_undone", {
        p_event_id: event.data!.id,
        p_original_start: anchor,
      });
      expect(undo.error).toBeNull();

      const undone = await occurrencesAs(cookieStore, s.clientId, range);
      expect(undone[0]).toMatchObject({ status: "overdue" });
      expect(undone[0]).not.toHaveProperty("actor");
    } finally {
      await cleanUp(s);
    }
  });

  it("[F0-11][AC-05] a carer on an active shift can tick off, is shown as the assignee, and is refused once the shift is over", async () => {
    const s = await seed();
    try {
      const { client: helenClient, cookieStore: helenSession } = await signIn(s.helen.email);
      const anchor = at(-10 * 60_000);
      const event = await helenClient
        .from("care_events")
        .insert({ client_id: s.clientId, title: "Walk with Margaret", starts_at: anchor })
        .select("id")
        .single();
      expect(event.error).toBeNull();

      const shift = await s.admin.from("shifts").insert({
        client_id: s.clientId,
        carer_id: s.aisha.userId,
        starts_at: new Date(Date.now() - HOUR).toISOString(),
        ends_at: new Date(Date.now() + HOUR).toISOString(),
      });
      expect(shift.error).toBeNull();

      const { client: aishaClient } = await signIn(s.aisha.email);
      const tick = await aishaClient.rpc("set_occurrence_done", {
        p_event_id: event.data!.id,
        p_original_start: anchor,
      });
      expect(tick.error).toBeNull();
      expect(tick.data).toMatchObject({
        actor_display_name: "Aisha Rahman",
        organisation_id: s.orgId,
      });

      const range = { from: day(-DAY), to: day(DAY) };
      const seen = await occurrencesAs(helenSession, s.clientId, range);
      expect(seen[0]).toMatchObject({
        status: "done",
        actor: "Aisha Rahman",
        assignee: "Aisha Rahman",
      });

      // The shift ends: the carer can no longer tick anything off for Margaret.
      await s.admin
        .from("shifts")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("client_id", s.clientId);
      const again = await aishaClient.rpc("set_occurrence_done", {
        p_event_id: event.data!.id,
        p_original_start: at(-20 * 60_000),
      });
      expect(again.error?.code).toBe("42501");
    } finally {
      await cleanUp(s);
    }
  });

  it("[F0-11][AC-07] another client's family gets no occurrences and cannot read Margaret's events", async () => {
    const s = await seed();
    try {
      const { client: helenClient } = await signIn(s.helen.email);
      await helenClient.from("care_events").insert({
        client_id: s.clientId,
        title: "Private",
        starts_at: "2026-11-30T09:00:00+11:00",
      });

      const { client: rosaClient, cookieStore: rosaSession } = await signIn(s.rosa.email);
      const rows = await rosaClient.from("care_events").select("id").eq("client_id", s.clientId);
      expect(rows.data ?? []).toHaveLength(0);

      const occurrences = await occurrencesAs(rosaSession, s.clientId, {
        from: "2026-11-30",
        to: "2026-12-06",
      });
      expect(occurrences).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[F0-11][AC-08] a deactivated event returns no future occurrences, and its past ones stay with their completions", async () => {
    const s = await seed();
    try {
      const { client, cookieStore } = await signIn(s.helen.email);
      const anchor = at(-21 * DAY);
      const event = await client
        .from("care_events")
        .insert({
          client_id: s.clientId,
          title: "Eye drops",
          starts_at: anchor,
          recurrence: { frequency: "weekly", interval: 1 },
        })
        .select("id")
        .single();
      expect(event.error).toBeNull();

      await client.rpc("set_occurrence_done", {
        p_event_id: event.data!.id,
        p_original_start: anchor,
      });
      const deactivated = await client
        .from("care_events")
        .update({ is_active: false })
        .eq("id", event.data!.id);
      expect(deactivated.error).toBeNull();

      const history = await occurrencesAs(cookieStore, s.clientId, {
        from: day(-22 * DAY),
        to: day(0),
      });
      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history[0]).toMatchObject({ status: "done", actor: "Helen Doyle" });

      const nextMonth = await occurrencesAs(cookieStore, s.clientId, {
        from: day(DAY),
        to: day(35 * DAY),
      });
      expect(nextMonth).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });
});
