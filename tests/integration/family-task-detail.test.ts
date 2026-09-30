// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { melbourneDateKey } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied).
// These tests create users, clients, events, shifts and completions, so they run only when NEXT_PUBLIC_SUPABASE_URL is a local address and
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
  return `fam-15-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  // Carer read/edit access derives solely from an active shift (F0-18): each test that
  // needs Aisha assigned to a client creates its own `shifts` row inline.

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

/** Reads through the real contract as the signed-in person, the way the Task detail page does. */
async function readAs<T>(
  session: Map<string, string>,
  run: (q: typeof import("@/server/events/queries")) => Promise<T>,
) {
  return withSession(session, async () => run(await import("@/server/events/queries")));
}

/** The key the contract gives an event's occurrence starting at `anchor`, read as `session`. */
async function keyOf(session: Map<string, string>, clientId: string, eventId: string) {
  const found = await readAs(session, (q) =>
    q.getOccurrences(clientId, { from: day(-4 * DAY), to: day(DAY) }, { type: "all" }),
  );
  const match = found.find((o) => o.eventId === eventId);
  if (!match) throw new Error("no occurrence for the event in the range");
  return match.key;
}

async function makeEvent(
  client: Awaited<ReturnType<typeof signIn>>["client"],
  clientId: string,
  title: string,
  startsAt: string,
  completionMode: "manual" | "automatic" = "manual",
) {
  const event = await client
    .from("care_events")
    .insert({ client_id: clientId, title, starts_at: startsAt, completion_mode: completionMode })
    .select("id")
    .single();
  expect(event.error).toBeNull();
  return event.data!.id;
}

describe.skipIf(!hasLocalSupabase)("[FAM-15] Family — Task detail against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[FAM-15][AC-01] T-02 a task Aisha ticks off reads back done, by 'Aisha Rahman', with a completion time", async () => {
    const s = await seed();
    try {
      const { client: helen, cookieStore: helenSession } = await signIn(s.helen.email);
      const anchor = at(-10 * 60_000);
      const eventId = await makeEvent(helen, s.clientId, "Morning medication", anchor);
      await s.admin.from("shifts").insert({
        client_id: s.clientId,
        carer_id: s.aisha.userId,
        starts_at: new Date(Date.now() - HOUR).toISOString(),
        ends_at: new Date(Date.now() + HOUR).toISOString(),
      });
      const { client: aisha } = await signIn(s.aisha.email);
      const tick = await aisha.rpc("set_occurrence_done", {
        p_event_id: eventId,
        p_original_start: anchor,
      });
      expect(tick.error).toBeNull();

      const key = await keyOf(helenSession, s.clientId, eventId);
      const occurrence = await readAs(helenSession, (q) => q.getOccurrence(s.clientId, key));

      expect(occurrence).toMatchObject({ status: "done", actor: "Aisha Rahman" });
      expect(occurrence).toHaveProperty("completedAt", expect.any(String));
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-15][AC-02] T-04 the assignee is the covering shift's carer, the actor once someone else completes it, and absent with no shift", async () => {
    const s = await seed();
    try {
      const { client: helen, cookieStore: helenSession } = await signIn(s.helen.email);
      const covered = at(-10 * 60_000);
      const doneByHelen = at(-20 * 60_000);
      const uncovered = at(-3 * DAY);
      const coveredId = await makeEvent(helen, s.clientId, "Covered", covered);
      const doneId = await makeEvent(helen, s.clientId, "Done by family", doneByHelen);
      const uncoveredId = await makeEvent(helen, s.clientId, "Uncovered", uncovered);
      await s.admin.from("shifts").insert({
        client_id: s.clientId,
        carer_id: s.aisha.userId,
        starts_at: new Date(Date.now() - HOUR).toISOString(),
        ends_at: new Date(Date.now() + HOUR).toISOString(),
      });
      const tick = await helen.rpc("set_occurrence_done", {
        p_event_id: doneId,
        p_original_start: doneByHelen,
      });
      expect(tick.error).toBeNull();

      const read = async (eventId: string) => {
        const key = await keyOf(helenSession, s.clientId, eventId);
        return readAs(helenSession, (q) => q.getOccurrence(s.clientId, key));
      };

      expect(await read(coveredId)).toMatchObject({ assignee: "Aisha Rahman" });
      expect(await read(doneId)).toMatchObject({
        status: "done",
        actor: "Helen Doyle",
        assignee: "Aisha Rahman",
      });
      expect(await read(uncoveredId)).not.toHaveProperty("assignee");
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-15][AC-04] T-06 another client's key, and an unknown key, are not found", async () => {
    const s = await seed();
    try {
      const { client: helen, cookieStore: helenSession } = await signIn(s.helen.email);
      const { cookieStore: rosaSession } = await signIn(s.rosa.email);
      const eventId = await makeEvent(helen, s.clientId, "Morning medication", at(-10 * 60_000));
      const key = await keyOf(helenSession, s.clientId, eventId);

      expect(await readAs(helenSession, (q) => q.getOccurrence(s.clientId, key))).toBeDefined();
      // Margaret's key under Robert's route: not his, so not found for his own family or hers.
      expect(await readAs(rosaSession, (q) => q.getOccurrence(s.otherId, key))).toBeUndefined();
      expect(await readAs(helenSession, (q) => q.getOccurrence(s.otherId, key))).toBeUndefined();
      // Margaret's key read by Robert's family under Margaret's route: RLS returns nothing.
      expect(await readAs(rosaSession, (q) => q.getOccurrence(s.clientId, key))).toBeUndefined();
      expect(
        await readAs(helenSession, (q) =>
          q.getOccurrence(s.clientId, "no-such-event:2026-01-01T00:00:00+11:00"),
        ),
      ).toBeUndefined();
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-15][AC-06] T-09 a plain event opens for its own client as kind 'event', and not for another client", async () => {
    const s = await seed();
    try {
      const { client: helen, cookieStore: helenSession } = await signIn(s.helen.email);
      const { cookieStore: rosaSession } = await signIn(s.rosa.email);
      const eventId = await makeEvent(
        helen,
        s.clientId,
        "Afternoon walk",
        at(-10 * 60_000),
        "automatic",
      );
      const key = await keyOf(helenSession, s.clientId, eventId);

      const opened = await readAs(helenSession, (q) =>
        q.getOccurrence(s.clientId, key, { type: "all" }),
      );
      expect(opened).toMatchObject({ kind: "event", title: "Afternoon walk" });
      expect(opened).not.toHaveProperty("status");

      expect(
        await readAs(rosaSession, (q) => q.getOccurrence(s.clientId, key, { type: "all" })),
      ).toBeUndefined();
      expect(
        await readAs(rosaSession, (q) => q.getOccurrence(s.otherId, key, { type: "all" })),
      ).toBeUndefined();
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-15][AC-07] T-10 an occurrence completed and then cancelled still opens as done, and the range reads still hide it", async () => {
    const s = await seed();
    try {
      const { client: helen, cookieStore: helenSession } = await signIn(s.helen.email);
      const anchor = at(-10 * 60_000);
      const eventId = await makeEvent(helen, s.clientId, "Morning medication", anchor);
      const tick = await helen.rpc("set_occurrence_done", {
        p_event_id: eventId,
        p_original_start: anchor,
      });
      expect(tick.error).toBeNull();
      const key = await keyOf(helenSession, s.clientId, eventId);

      const cancel = await s.admin
        .from("care_event_overrides")
        .insert({ event_id: eventId, original_start: anchor, kind: "cancelled" } as never);
      expect(cancel.error).toBeNull();

      const opened = await readAs(helenSession, (q) => q.getOccurrence(s.clientId, key));
      expect(opened).toMatchObject({ status: "done", actor: "Helen Doyle" });

      const range = { from: day(-DAY), to: day(DAY) };
      const listed = await readAs(helenSession, (q) => q.getOccurrences(s.clientId, range));
      expect(listed.find((o) => o.eventId === eventId)).toBeUndefined();
    } finally {
      await cleanUp(s);
    }
  });
});
