// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { melbourneDateKey } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// [FAM-18] Delete an event, or an occurrence, and give a repeating event an end date, through the
// `deleteEventOccurrence` / `createEvent` Server Actions against a real database: family, or a carer on
// shift (`can_edit_care_events`, F0-11 / PD-041); nobody else. Nothing is physically deleted. Needs a running local
// Supabase stack (`supabase start`, migrations applied); runs only when NEXT_PUBLIC_SUPABASE_URL
// is a local address and skips against a hosted project. If `.env.local` points at a hosted
// project, override the three variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;
const RANGE = { from: "2027-03-01", to: "2027-04-11" };

const at = (offsetMs: number) =>
  new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000).toISOString();

function unique(label: string) {
  return `fam-18-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  label: string,
  role: "family" | "carer",
  firstName: string,
  organisationId: string | null,
) {
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
    first_name: firstName,
    last_name: role === "carer" ? "Rahman" : "Doyle",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/** Margaret (Helen's), Aisha the carer with no shift yet, and a second client Aisha never works. */
async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("org") })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const helen = await createUser("helen", "family", "Helen", null);
  const aisha = await createUser("aisha", "carer", "Aisha", org.data.id);

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
  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.userId });

  return {
    admin,
    orgId: org.data.id,
    helen,
    aisha,
    clientId: client.data.id,
    otherId: other.data.id,
  };
}
type Seed = Awaited<ReturnType<typeof seed>>;

async function giveShift(s: Seed, clientId: string, startOffsetMs: number, endOffsetMs: number) {
  const shift = await s.admin
    .from("shifts")
    .insert({
      client_id: clientId,
      carer_id: s.aisha.userId,
      starts_at: at(startOffsetMs),
      ends_at: at(endOffsetMs),
    })
    .select("id")
    .single();
  if (shift.error || !shift.data) throw shift.error ?? new Error("shift");
  return shift.data.id;
}

// Events and their history restrict deleting a client, so the clients are left behind (unique names).
async function cleanUp(s: Seed) {
  for (const user of [s.helen, s.aisha]) await s.admin.auth.admin.deleteUser(user.userId);
  await s.admin.from("shifts").delete().in("client_id", [s.clientId, s.otherId]);
  await s.admin.from("care_events").delete().in("client_id", [s.clientId, s.otherId]);
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

const WEEKLY_FROM = "2027-03-02"; // Tuesday, 10:00 Melbourne (AEDT, +11:00)
const occurrenceStart = (weeks: number) =>
  new Date(Date.parse("2027-03-02T10:00:00+11:00") + weeks * 7 * 24 * HOUR).toISOString();

async function insertWeekly(s: Seed, extra: Record<string, unknown> = {}) {
  const event = await s.admin
    .from("care_events")
    .insert({
      client_id: s.clientId,
      title: unique("physio"),
      starts_at: "2027-03-02T10:00:00+11:00",
      duration_minutes: 30,
      recurrence: { frequency: "weekly", interval: 1 },
      created_by: s.helen.userId,
      ...extra,
    })
    .select("id, title")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");
  return event.data;
}

async function deleteAs(
  session: Map<string, string>,
  clientId: string,
  eventId: string,
  weeks: number,
  scope: "occurrence" | "future",
) {
  return withSession(session, async () => {
    const { deleteEventOccurrence } = await import("@/server/events/actions");
    return deleteEventOccurrence({
      clientId,
      eventId,
      occurrenceOriginalStart: occurrenceStart(weeks),
      scope,
    });
  });
}

async function datesAs(session: Map<string, string>, clientId: string, eventId: string) {
  return withSession(session, async () => {
    const { getOccurrences } = await import("@/server/events/queries");
    return (await getOccurrences(clientId, RANGE))
      .filter((o) => o.eventId === eventId)
      .map((o) => melbourneDateKey(o.start))
      .sort();
  });
}

describe.skipIf(!hasLocalSupabase)(
  "[FAM-18] Delete event and recurrence end date against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[FAM-18][AC-04] T-04 deleting 'This occurrence' hides only that one", async () => {
      const s = await seed();
      try {
        const event = await insertWeekly(s);
        const helen = await signIn(s.helen.email);

        const result = await deleteAs(helen, s.clientId, event.id, 1, "occurrence");

        expect(result.ok).toBe(true);
        expect(await datesAs(helen, s.clientId, event.id)).toEqual([
          "2027-03-02",
          "2027-03-16",
          "2027-03-23",
          "2027-03-30",
          "2027-04-06",
        ]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-18][AC-05] T-04 'This and all future' keeps earlier occurrences and ends the series the day before", async () => {
      const s = await seed();
      try {
        const event = await insertWeekly(s);
        const helen = await signIn(s.helen.email);

        const result = await deleteAs(helen, s.clientId, event.id, 2, "future");

        expect(result.ok).toBe(true);
        expect(await datesAs(helen, s.clientId, event.id)).toEqual(["2027-03-02", "2027-03-09"]);
        const row = await s.admin
          .from("care_events")
          .select("recurrence_until, is_active")
          .eq("id", event.id)
          .single();
        expect(row.data).toEqual({ recurrence_until: "2027-03-15", is_active: true });
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-18][AC-06] T-04 'This and all future' from the first occurrence leaves nothing", async () => {
      const s = await seed();
      try {
        const event = await insertWeekly(s);
        const helen = await signIn(s.helen.email);

        expect((await deleteAs(helen, s.clientId, event.id, 0, "future")).ok).toBe(true);

        expect(await datesAs(helen, s.clientId, event.id)).toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-18][AC-08] T-05 a Done occurrence cannot be deleted", async () => {
      const s = await seed();
      try {
        const event = await insertWeekly(s);
        await s.admin.from("care_event_completions").insert({
          event_id: event.id,
          client_id: s.clientId,
          original_start: occurrenceStart(0),
          action: "done",
          actor_id: s.aisha.userId,
          actor_display_name: "Aisha Rahman",
        });
        const helen = await signIn(s.helen.email);

        const result = await deleteAs(helen, s.clientId, event.id, 0, "occurrence");

        expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
        expect(await datesAs(helen, s.clientId, event.id)).toContain("2027-03-02");
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-18][AC-09] T-05 a carer on shift can delete; off shift is refused and nothing changes", async () => {
      const s = await seed();
      try {
        const event = await insertWeekly(s);
        const aisha = await signIn(s.aisha.email);

        const offShift = await deleteAs(aisha, s.clientId, event.id, 1, "occurrence");
        expect(offShift).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });

        await giveShift(s, s.clientId, -HOUR, HOUR);
        const onShift = await deleteAs(aisha, s.clientId, event.id, 1, "occurrence");
        expect(onShift.ok).toBe(true);
        const helen = await signIn(s.helen.email);
        expect(await datesAs(helen, s.clientId, event.id)).not.toContain("2027-03-09");
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-18][AC-10] T-05 another family member is refused and nothing changes", async () => {
      const s = await seed();
      try {
        const event = await insertWeekly(s);
        const robert = await createUser("robert", "family", "Robert", null);
        const session = await signIn(robert.email);

        const result = await deleteAs(session, s.clientId, event.id, 1, "future");

        expect(result).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
        const row = await s.admin
          .from("care_events")
          .select("recurrence_until")
          .eq("id", event.id)
          .single();
        expect(row.data?.recurrence_until).toBeNull();
        await s.admin.auth.admin.deleteUser(robert.userId);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-18][AC-13][AC-15] T-08 an end date is inclusive, and Edit can change and clear it", async () => {
      const s = await seed();
      try {
        const helen = await signIn(s.helen.email);
        const created = await withSession(helen, async () => {
          const { createEvent } = await import("@/server/events/actions");
          return createEvent({
            clientId: s.clientId,
            title: unique("course"),
            description: "",
            date: WEEKLY_FROM,
            startTime: "10:00",
            durationMinutes: 30,
            recurrence: "weekly",
            isTask: true,
            endDate: "2027-03-16",
          });
        });
        if (!created.ok) throw new Error("create failed");
        const eventId = created.data.eventId;

        expect(await datesAs(helen, s.clientId, eventId)).toEqual([
          "2027-03-02",
          "2027-03-09",
          "2027-03-16",
        ]);

        const edit = (endDate: string | null) =>
          withSession(helen, async () => {
            const { updateEvent } = await import("@/server/events/actions");
            return updateEvent({
              clientId: s.clientId,
              eventId,
              occurrenceOriginalStart: occurrenceStart(0),
              title: "Course",
              description: "",
              date: WEEKLY_FROM,
              startTime: "10:00",
              durationMinutes: 30,
              recurrence: "weekly",
              isTask: true,
              scope: "series",
              endDate,
            });
          });
        expect((await edit("2027-03-23")).ok).toBe(true);
        expect(await datesAs(helen, s.clientId, eventId)).toHaveLength(4);
        expect((await edit(null)).ok).toBe(true);
        expect((await datesAs(helen, s.clientId, eventId)).length).toBeGreaterThan(5);
      } finally {
        await cleanUp(s);
      }
    });
  },
);
