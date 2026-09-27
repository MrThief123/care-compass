// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { melbourneDateKey } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied). Skips against a
// hosted project, exactly as tests/integration/care-events.test.ts does — see its header comment
// for how to point this run at the local stack.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const DAY = 24 * 60 * 60 * 1000;

function unique(label: string) {
  return `fam-06-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  // Assigned to the client, but never given an active shift: `can_edit_care_events` still
  // refuses her (OQ-09), so this is the "a carer" half of AC-04 without needing a shifts fixture.
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

interface CreateEventTestInput {
  clientId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  recurrence: "none" | "weekly";
  isTask: boolean;
}

async function createEventAs(session: Map<string, string>, input: CreateEventTestInput) {
  return withSession(session, async () => {
    const { createEvent } = await import("@/server/events/actions");
    return createEvent(input);
  });
}

async function occurrencesAs(
  session: Map<string, string>,
  clientId: string,
  range: { from: string; to: string },
) {
  return withSession(session, async () => {
    const { getOccurrences } = await import("@/server/events/queries");
    return getOccurrences(clientId, range);
  });
}

describe.skipIf(!hasLocalSupabase)("[FAM-06] Family — Add event against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[FAM-06][AC-01] T-01 a weekly event recurs every week from the chosen date", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.helen.email);
      const title = unique("weekly-weigh-in");

      const result = await createEventAs(cookieStore, {
        clientId: s.clientId,
        title,
        description: "",
        date: "2026-12-07", // a Monday
        startTime: "09:30",
        durationMinutes: 15,
        recurrence: "weekly",
        isTask: true,
      });
      expect(result.ok).toBe(true);

      // Four Mondays from the anchor, all four weeks apart.
      const occurrences = await occurrencesAs(cookieStore, s.clientId, {
        from: "2026-12-07",
        to: "2026-12-28",
      });
      const matching = occurrences
        .filter((o) => o.title === title)
        .map((o) => melbourneDateKey(o.start));
      expect(matching).toEqual(["2026-12-07", "2026-12-14", "2026-12-21", "2026-12-28"]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-06][AC-01] a one-off ('Does not repeat') event has exactly one occurrence", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.helen.email);
      const title = unique("one-off");

      await createEventAs(cookieStore, {
        clientId: s.clientId,
        title,
        description: "",
        date: "2026-12-10",
        startTime: "14:00",
        durationMinutes: 30,
        recurrence: "none",
        isTask: true,
      });

      const occurrences = await occurrencesAs(cookieStore, s.clientId, {
        from: "2026-12-01",
        to: "2026-12-31",
      });
      expect(occurrences.filter((o) => o.title === title)).toHaveLength(1);
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-06][AC-04] T-04 a carer with no active shift for the client is refused", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.aisha.email);

      const result = await createEventAs(cookieStore, {
        clientId: s.clientId,
        title: unique("refused"),
        description: "",
        date: "2026-12-07",
        startTime: "09:00",
        durationMinutes: 0,
        recurrence: "none",
        isTask: true,
      });

      expect(result).toEqual({
        ok: false,
        error: { code: "NOT_ALLOWED", message: "Not permitted to add an event for this client." },
      });
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-06][AC-04] T-04 an unrelated family user is refused", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.rosa.email);

      const result = await createEventAs(cookieStore, {
        clientId: s.clientId,
        title: unique("refused"),
        description: "",
        date: "2026-12-07",
        startTime: "09:00",
        durationMinutes: 0,
        recurrence: "none",
        isTask: true,
      });

      expect(result).toEqual({
        ok: false,
        error: { code: "NOT_ALLOWED", message: "Not permitted to add an event for this client." },
      });
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-06][Scope] a malformed payload is rejected before touching the database", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.helen.email);

      const result = await createEventAs(cookieStore, {
        clientId: s.clientId,
        title: "",
        description: "",
        date: "2026-12-07",
        startTime: "09:00",
        durationMinutes: 0,
        recurrence: "none",
        isTask: true,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    } finally {
      await cleanUp(s);
    }
  });
});
