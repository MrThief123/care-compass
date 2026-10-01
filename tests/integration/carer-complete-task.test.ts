// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { melbourneDateKey } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// [CAR-06] Tick-off through the `setOccurrenceDone` Server Action against a real database: it needs a shift in progress
// (F0-11's `set_occurrence_done`), records the signed-in carer, and refuses once the shift ends. Needs a running local Supabase stack (`supabase start`,
// migrations applied); runs only when NEXT_PUBLIC_SUPABASE_URL is a local address and skips
// against a hosted project. If `.env.local` points at a hosted project, override the three
// variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The Melbourne calendar date `offsetMs` from now: what the contract's range takes. */
const day = (offsetMs: number) => melbourneDateKey(new Date(Date.now() + offsetMs).toISOString());

function unique(label: string) {
  return `car-06-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

const at = (offsetMs: number) =>
  new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000).toISOString();

// Completions are append-only and restrict deleting their client, so the client that got a tick is
// left behind (unique name); users, shifts and the organisation go.
async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("banksia") })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");
  const aisha = await createUser("aisha", "carer", org.data.id);
  const helen = await createUser("helen", "family", null);
  const client = await admin
    .from("clients")
    .insert({
      first_name: "Margaret",
      last_name: unique("doyle"),
      organisation_id: org.data.id,
      suburb: "Preston VIC",
    })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  const family = await admin.from("client_family_members").insert({
    client_id: client.data.id,
    profile_id: helen.userId,
    relationship_label: "Daughter",
  });
  if (family.error) throw family.error;
  const anchor = at(-10 * 60_000);
  const event = await admin
    .from("care_events")
    .insert({ client_id: client.data.id, title: "Physiotherapy", starts_at: anchor })
    .select("id")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");
  const shift = await admin.from("shifts").insert({
    client_id: client.data.id,
    carer_id: aisha.userId,
    starts_at: at(-HOUR),
    ends_at: at(HOUR),
  });
  if (shift.error) throw shift.error;
  return {
    admin,
    orgId: org.data.id,
    aisha,
    helen,
    clientId: client.data.id,
    eventId: event.data.id,
    key: `${event.data.id}:${anchor}`,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.aisha, s.helen]) await s.admin.auth.admin.deleteUser(user.userId);
  await s.admin.from("shifts").delete().eq("client_id", s.clientId);
  await s.admin.from("clients").delete().eq("id", s.clientId); // refused once it has a completion: left behind
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

describe.skipIf(!hasLocalSupabase)("[CAR-06] carer tick-off against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[CAR-06][AC-05] T-05 a carer on shift ticks a task: she is recorded as the actor, and the family sees her name", async () => {
    const s = await seed();
    try {
      const aisha = await signedInAs(s.aisha.email);
      const result = await withSession(aisha, async () => {
        const { setOccurrenceDone } = await import("@/server/events/actions");
        return setOccurrenceDone(s.key);
      });

      expect(result).toMatchObject({ ok: true, data: { actor: "aisha Test" } });
      const rows = await s.admin
        .from("care_event_completions")
        .select("action, actor_id, actor_display_name")
        .eq("client_id", s.clientId);
      expect(rows.data).toEqual([
        { action: "done", actor_id: s.aisha.userId, actor_display_name: "aisha Test" },
      ]);

      const helen = await signedInAs(s.helen.email);
      const seen = await withSession(helen, async () => {
        const { getOccurrences } = await import("@/server/events/queries");
        return getOccurrences(s.clientId, { from: day(-DAY), to: day(DAY) });
      });
      expect(seen.find((o) => o.eventId === s.eventId)).toMatchObject({
        status: "done",
        actor: "aisha Test",
      });
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-06][AC-05] T-05 once the shift has ended the server refuses the tick and records nothing", async () => {
    const s = await seed();
    try {
      await s.admin
        .from("shifts")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("client_id", s.clientId);

      const aisha = await signedInAs(s.aisha.email);
      const result = await withSession(aisha, async () => {
        const { setOccurrenceDone } = await import("@/server/events/actions");
        return setOccurrenceDone(s.key);
      });

      expect(result).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
      const rows = await s.admin
        .from("care_event_completions")
        .select("id")
        .eq("client_id", s.clientId);
      expect(rows.data).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });
});
