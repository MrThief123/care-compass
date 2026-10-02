// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { melbourneDateKey } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// [CAR-07] Add and edit events through the `createEvent` and `updateEvent` Server Actions as a
// carer, against a real database: allowed only while a shift with the client is in progress
// (`can_edit_care_events`, F0-11 / PD-041), and the family sees the result. Needs a running local
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
const RANGE = { from: "2027-03-01", to: "2027-03-07" };

const at = (offsetMs: number) =>
  new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000).toISOString();

function unique(label: string) {
  return `car-07-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

const eventInput = (clientId: string, title: string) => ({
  clientId,
  title,
  description: "Noticed while caring",
  date: "2027-03-02",
  startTime: "10:00",
  durationMinutes: 30,
  recurrence: "none" as const,
  isTask: true,
});

async function createEventAs(session: Map<string, string>, clientId: string, title: string) {
  return withSession(session, async () => {
    const { createEvent } = await import("@/server/events/actions");
    return createEvent(eventInput(clientId, title));
  });
}

async function updateEventAs(
  session: Map<string, string>,
  clientId: string,
  eventId: string,
  title: string,
) {
  return withSession(session, async () => {
    const { updateEvent } = await import("@/server/events/actions");
    return updateEvent({
      ...eventInput(clientId, title),
      eventId,
      // The event's anchor start: 2027-03-02 10:00 Melbourne (AEDT, +11:00).
      occurrenceOriginalStart: "2027-03-02T10:00:00+11:00",
      scope: "series",
    });
  });
}

async function titlesAs(session: Map<string, string>, clientId: string) {
  return withSession(session, async () => {
    const { getOccurrences } = await import("@/server/events/queries");
    return (await getOccurrences(clientId, RANGE)).map((o) => o.title);
  });
}

async function createdBy(s: Seed, title: string) {
  const rows = await s.admin.from("care_events").select("id, created_by").eq("title", title);
  return rows.data ?? [];
}

describe.skipIf(!hasLocalSupabase)(
  "[CAR-07] Carer — Add and edit events against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[CAR-07][AC-01] T-01 an on-shift carer's event is the family's: Helen sees it on the Calendar, created by Aisha", async () => {
      const s = await seed();
      try {
        await giveShift(s, s.clientId, -HOUR, HOUR);
        const aisha = await signIn(s.aisha.email);
        const title = unique("garden-walk");

        const result = await createEventAs(aisha, s.clientId, title);

        expect(result.ok).toBe(true);
        const rows = await createdBy(s, title);
        expect(rows).toHaveLength(1);
        expect(rows[0]!.created_by).toBe(s.aisha.userId);
        const helen = await signIn(s.helen.email);
        expect(await titlesAs(helen, s.clientId)).toContain(title);
        expect(melbourneDateKey("2027-03-02T10:00:00+11:00")).toBe("2027-03-02");
      } finally {
        await cleanUp(s);
      }
    });

    it.each([
      ["no shift at all", async () => undefined],
      ["a shift that has not started", async (s: Seed) => giveShift(s, s.clientId, HOUR, 2 * HOUR)],
      ["a shift that has ended", async (s: Seed) => giveShift(s, s.clientId, -3 * HOUR, -HOUR)],
      // A shift with another client does not open this one.
      [
        "a shift in progress with a different client",
        async (s: Seed) => giveShift(s, s.otherId, -HOUR, HOUR),
      ],
    ])(
      "[CAR-07][AC-02] T-02 createEvent with %s is refused and creates nothing",
      async (_label, arrange) => {
        const s = await seed();
        try {
          await arrange(s);
          const aisha = await signIn(s.aisha.email);
          const title = unique("refused");

          const result = await createEventAs(aisha, s.clientId, title);

          expect(result).toEqual({
            ok: false,
            error: {
              code: "NOT_ALLOWED",
              message: "Not permitted to add an event for this client.",
            },
          });
          expect(await createdBy(s, title)).toHaveLength(0);
        } finally {
          await cleanUp(s);
        }
      },
    );

    it("[CAR-07][AC-02] T-02 updateEvent off shift is refused and the event is unchanged", async () => {
      const s = await seed();
      try {
        const event = await s.admin
          .from("care_events")
          .insert({
            client_id: s.clientId,
            title: "Physiotherapy",
            starts_at: "2027-03-02T10:00:00+11:00",
            duration_minutes: 30,
            created_by: s.helen.userId,
          })
          .select("id")
          .single();
        if (event.error || !event.data) throw event.error ?? new Error("event");
        await giveShift(s, s.clientId, HOUR, 2 * HOUR);
        const aisha = await signIn(s.aisha.email);

        const result = await updateEventAs(aisha, s.clientId, event.data.id, "Changed by Aisha");

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");
        const after = await s.admin.from("care_events").select("title").eq("id", event.data.id);
        expect(after.data?.[0]?.title).toBe("Physiotherapy");
      } finally {
        await cleanUp(s);
      }
    });

    it("[CAR-07][AC-05] T-05 an on-shift carer edits an event Helen created, and Helen sees the change", async () => {
      const s = await seed();
      try {
        const helen = await signIn(s.helen.email);
        const original = unique("physio");
        const created = await createEventAs(helen, s.clientId, original);
        if (!created.ok) throw new Error("setup: Helen could not create the event");
        await giveShift(s, s.clientId, -HOUR, HOUR);
        const aisha = await signIn(s.aisha.email);
        const renamed = unique("physio-extra");

        const result = await updateEventAs(aisha, s.clientId, created.data.eventId, renamed);

        expect(result.ok).toBe(true);
        const titles = await titlesAs(helen, s.clientId);
        expect(titles).toContain(renamed);
        expect(titles).not.toContain(original);
      } finally {
        await cleanUp(s);
      }
    });

    it("[CAR-07][AC-06] T-06 the shift ends between opening the form and saving: createEvent and updateEvent are refused", async () => {
      const s = await seed();
      try {
        const helen = await signIn(s.helen.email);
        const existing = await createEventAs(helen, s.clientId, unique("existing"));
        if (!existing.ok) throw new Error("setup: Helen could not create the event");
        const shiftId = await giveShift(s, s.clientId, -HOUR, HOUR);
        const aisha = await signIn(s.aisha.email);
        const title = unique("too-late");

        // The form is open and the shift is still in progress...
        expect((await createEventAs(aisha, s.clientId, unique("in-time"))).ok).toBe(true);
        // ...then the shift ends (an admin shortens it) before Save.
        const ended = await s.admin
          .from("shifts")
          .update({ starts_at: at(-2 * HOUR), ends_at: at(-60_000) })
          .eq("id", shiftId);
        expect(ended.error).toBeNull();

        const created = await createEventAs(aisha, s.clientId, title);
        const updated = await updateEventAs(aisha, s.clientId, existing.data.eventId, title);

        expect(created.ok).toBe(false);
        if (!created.ok) expect(created.error.code).toBe("NOT_ALLOWED");
        expect(updated.ok).toBe(false);
        if (!updated.ok) expect(updated.error.code).toBe("NOT_ALLOWED");
        expect(await createdBy(s, title)).toHaveLength(0);
      } finally {
        await cleanUp(s);
      }
    });
  },
);
