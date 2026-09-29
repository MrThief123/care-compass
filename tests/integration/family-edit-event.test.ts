// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied). Skips against a
// hosted project, the same convention as the other integration tests in this directory.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `fam-07-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  role: "family" | "carer" | "admin",
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
    last_name: "Test",
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
  const priya = await createUser("Priya", "admin", org.data.id);
  const aisha = await createUser("Aisha", "carer", org.data.id);
  const dan = await createUser("Dan", "carer", org.data.id);

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
  const clientId = client.data.id;
  const otherId = other.data.id;

  await admin.from("client_family_members").insert([
    { client_id: clientId, profile_id: helen.userId },
    { client_id: otherId, profile_id: rosa.userId },
  ]);
  await admin.from("shifts").insert({
    client_id: clientId,
    carer_id: aisha.userId,
    starts_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  const weekly = await admin
    .from("care_events")
    .insert({
      client_id: clientId,
      title: "Physiotherapy",
      description: "Original description",
      starts_at: "2026-11-30T09:00:00+11:00",
      duration_minutes: 30,
      recurrence: { frequency: "weekly", interval: 1 },
      completion_mode: "manual",
    })
    .select("id")
    .single();
  const oneOff = await admin
    .from("care_events")
    .insert({
      client_id: clientId,
      title: "One-off checkup",
      description: "",
      starts_at: "2026-12-01T10:00:00+11:00",
      duration_minutes: 20,
      recurrence: null,
      completion_mode: "manual",
    })
    .select("id")
    .single();
  if (weekly.error || !weekly.data || oneOff.error || !oneOff.data) {
    throw new Error("events");
  }
  const weeklyId = weekly.data.id;
  const oneOffId = oneOff.data.id;

  const document = await admin
    .from("documents")
    .insert({
      client_id: clientId,
      event_id: weeklyId,
      storage_path: unique("path"),
      filename: "Physio referral.pdf",
      mime_type: "application/pdf",
      size_bytes: 1024,
      uploaded_by: helen.userId,
    })
    .select("id")
    .single();
  if (document.error) throw document.error;

  return {
    admin,
    orgId: org.data.id,
    helen,
    rosa,
    priya,
    aisha,
    dan,
    clientId,
    otherId,
    weeklyId,
    oneOffId,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa, s.priya, s.aisha, s.dan]) {
    await s.admin.auth.admin.deleteUser(user.userId);
  }
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

interface UpdateEventTestInput {
  clientId: string;
  eventId: string;
  occurrenceOriginalStart: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  recurrence: "none" | "weekly" | "fortnightly";
  isTask: boolean;
  scope: "occurrence" | "series";
}

async function updateEventAs(session: Map<string, string>, input: UpdateEventTestInput) {
  return withSession(session, async () => {
    const { updateEvent } = await import("@/server/events/actions");
    return updateEvent(input);
  });
}

async function getEventAs(session: Map<string, string>, clientId: string, eventId: string) {
  return withSession(session, async () => {
    const { getEvent } = await import("@/server/events/queries");
    return getEvent(clientId, eventId);
  });
}

async function getOccurrenceAs(session: Map<string, string>, clientId: string, key: string) {
  return withSession(session, async () => {
    const { getOccurrence } = await import("@/server/events/queries");
    return getOccurrence(clientId, key, { type: "all" });
  });
}

async function documentsAs(session: Map<string, string>, clientId: string, eventId: string) {
  return withSession(session, async () => {
    const { getEventDocuments } = await import("@/server/documents/queries");
    return getEventDocuments(clientId, eventId);
  });
}

const WEEKLY_ORIGINAL_START = "2026-11-30T09:00:00+11:00";

describe.skipIf(!hasLocalSupabase)("[FAM-07] Family — Edit event against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[FAM-07][AC-01] a changed description and title persist and read back", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.helen.email);

      const result = await updateEventAs(cookieStore, {
        clientId: s.clientId,
        eventId: s.weeklyId,
        occurrenceOriginalStart: WEEKLY_ORIGINAL_START,
        title: "Physiotherapy (updated)",
        description: "New description",
        date: "2026-11-30",
        startTime: "09:00",
        durationMinutes: 30,
        recurrence: "weekly",
        isTask: true,
        scope: "series",
      });
      expect(result.ok).toBe(true);

      const event = await getEventAs(cookieStore, s.clientId, s.weeklyId);
      expect(event).toMatchObject({
        title: "Physiotherapy (updated)",
        description: "New description",
      });
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-07][AC-02] weekly to fortnightly leaves an existing completion's row unchanged", async () => {
    const s = await seed();
    try {
      const { cookieStore, client: helenClient } = await signIn(s.helen.email);
      const done = await helenClient.rpc("set_occurrence_done", {
        p_event_id: s.weeklyId,
        p_original_start: WEEKLY_ORIGINAL_START,
      });
      expect(done.error).toBeNull();
      const before = await s.admin
        .from("care_event_completions")
        .select("actor_display_name, occurred_at")
        .eq("event_id", s.weeklyId)
        .eq("original_start", WEEKLY_ORIGINAL_START)
        .single();
      expect(before.data).toBeTruthy();

      const result = await updateEventAs(cookieStore, {
        clientId: s.clientId,
        eventId: s.weeklyId,
        occurrenceOriginalStart: WEEKLY_ORIGINAL_START,
        title: "Physiotherapy",
        description: "Original description",
        date: "2026-11-30",
        startTime: "09:00",
        durationMinutes: 30,
        recurrence: "fortnightly",
        isTask: true,
        scope: "series",
      });
      expect(result.ok).toBe(true);

      const after = await s.admin
        .from("care_event_completions")
        .select("actor_display_name, occurred_at")
        .eq("event_id", s.weeklyId)
        .eq("original_start", WEEKLY_ORIGINAL_START)
        .single();
      expect(after.data).toEqual(before.data);
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-07][AC-04] getEvent never returns another client's event; an unrelated family member reads nothing", async () => {
    const s = await seed();
    try {
      expect(
        await getEventAs((await signIn(s.rosa.email)).cookieStore, s.otherId, s.weeklyId),
      ).toBeUndefined();
      const { cookieStore } = await signIn(s.rosa.email);
      expect(await getEventAs(cookieStore, s.clientId, s.weeklyId)).toBeUndefined();
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-07][Scope] 'This occurrence' writes an override; the series' own anchor is unchanged", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.helen.email);

      const result = await updateEventAs(cookieStore, {
        clientId: s.clientId,
        eventId: s.weeklyId,
        occurrenceOriginalStart: WEEKLY_ORIGINAL_START,
        title: "Physiotherapy",
        description: "Original description",
        date: "2026-11-30",
        startTime: "14:00",
        durationMinutes: 45,
        recurrence: "weekly",
        isTask: true,
        scope: "occurrence",
      });
      expect(result.ok).toBe(true);

      const event = await getEventAs(cookieStore, s.clientId, s.weeklyId);
      expect(Date.parse(event!.start)).toBe(Date.parse(WEEKLY_ORIGINAL_START));

      const key = `${s.weeklyId}:${WEEKLY_ORIGINAL_START}`;
      const occurrence = await getOccurrenceAs(cookieStore, s.clientId, key);
      expect(occurrence?.start).toBe("2026-11-30T14:00:00+11:00");
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-07][Scope] 'Entire series' refuses a date change on a recurring event", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.helen.email);

      const result = await updateEventAs(cookieStore, {
        clientId: s.clientId,
        eventId: s.weeklyId,
        occurrenceOriginalStart: WEEKLY_ORIGINAL_START,
        title: "Physiotherapy",
        description: "Original description",
        date: "2026-12-07",
        startTime: "09:00",
        durationMinutes: 30,
        recurrence: "weekly",
        isTask: true,
        scope: "series",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-07][Scope] 'Entire series' may move a one-off event's date", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.helen.email);

      const result = await updateEventAs(cookieStore, {
        clientId: s.clientId,
        eventId: s.oneOffId,
        occurrenceOriginalStart: "2026-12-01T10:00:00+11:00",
        title: "One-off checkup",
        description: "",
        date: "2026-12-03",
        startTime: "11:00",
        durationMinutes: 20,
        recurrence: "none",
        isTask: true,
        scope: "series",
      });
      expect(result.ok).toBe(true);

      const event = await getEventAs(cookieStore, s.clientId, s.oneOffId);
      expect(Date.parse(event!.start)).toBe(Date.parse("2026-12-03T11:00:00+11:00"));
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-07][Scope] a carer with no active shift, and an unrelated family member, are refused", async () => {
    const s = await seed();
    try {
      for (const email of [s.dan.email, s.rosa.email]) {
        const { cookieStore } = await signIn(email);
        const result = await updateEventAs(cookieStore, {
          clientId: s.clientId,
          eventId: s.weeklyId,
          occurrenceOriginalStart: WEEKLY_ORIGINAL_START,
          title: "Hacked",
          description: "",
          date: "2026-11-30",
          startTime: "09:00",
          durationMinutes: 30,
          recurrence: "weekly",
          isTask: true,
          scope: "series",
        });
        expect(result).toEqual({
          ok: false,
          error: { code: "NOT_ALLOWED", message: "Not permitted to edit this event." },
        });
      }
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-07][PRD] getEventDocuments names the uploader and excludes an unrelated client", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.helen.email);

      const documents = await documentsAs(cookieStore, s.clientId, s.weeklyId);
      expect(documents).toHaveLength(1);
      expect(documents[0]).toMatchObject({
        name: "Physio referral.pdf",
        mimeType: "application/pdf",
        uploadedBy: "Helen Test",
      });

      const { cookieStore: rosaSession } = await signIn(s.rosa.email);
      expect(await documentsAs(rosaSession, s.clientId, s.weeklyId)).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });
});
