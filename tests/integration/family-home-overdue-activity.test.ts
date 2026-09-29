// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";
import type { OccurrenceStatus } from "@/types/domain";

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
const DAY = 24 * 3_600_000;

/** An occurrence start is a whole second (the database enforces it). */
const at = (offsetMs: number) =>
  new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000).toISOString();

function unique(label: string) {
  return `fam-02-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(firstName: string) {
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
    role: "family",
    organisation_id: null,
    first_name: firstName,
    last_name: "Doyle",
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

  const helen = await createUser("Helen");
  const rosa = await createUser("Rosa");

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

  return {
    admin,
    orgId: org.data.id,
    helen,
    rosa,
    clientId: client.data.id,
    otherId: other.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa]) await s.admin.auth.admin.deleteUser(user.userId);
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

async function taskLogAs(
  session: Map<string, string>,
  clientId: string,
  query: { status?: OccurrenceStatus; page?: number; q?: string } = {},
) {
  return withSession(session, async () => {
    const { getTaskLog } = await import("@/server/events/queries");
    return getTaskLog(clientId, query);
  });
}

describe.skipIf(!hasLocalSupabase)(
  "[FAM-02] Family Home — Overdue card and Recent activity against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[FAM-02][AC-01] the Overdue card's total is the full count, not just the rows shown", async () => {
      const s = await seed();
      try {
        const { client, cookieStore } = await signIn(s.helen.email);

        for (let i = 1; i <= 6; i++) {
          const created = await client.from("care_events").insert({
            client_id: s.clientId,
            title: `Overdue task ${i}`,
            starts_at: at(-i * DAY),
          });
          expect(created.error).toBeNull();
        }

        const overdue = await taskLogAs(cookieStore, s.clientId, { status: "overdue" });
        expect(overdue.total).toBe(6);
        expect(overdue.items).toHaveLength(6);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-02][AC-03] Recent activity is the 5 newest done-or-overdue occurrences, newest first", async () => {
      const s = await seed();
      try {
        const { client, cookieStore } = await signIn(s.helen.email);

        // 7 one-off tasks, a day apart; none is ticked off, so once its due time has passed
        // (they are all in the past) it reads Overdue.
        for (let i = 7; i >= 1; i--) {
          const created = await client.from("care_events").insert({
            client_id: s.clientId,
            title: `Task ${i}`,
            starts_at: at(-i * DAY),
          });
          expect(created.error).toBeNull();
        }

        const overdue = await taskLogAs(cookieStore, s.clientId, { status: "overdue" });
        expect(overdue.total).toBe(7);
        const done = await taskLogAs(cookieStore, s.clientId, { status: "done" });
        expect(done.total).toBe(0);

        const { selectRecentActivity } = await import("@/features/family-home/home-data");
        const recent = selectRecentActivity([...done.items, ...overdue.items]);

        expect(recent.map((occurrence) => occurrence.title)).toEqual([
          "Task 1",
          "Task 2",
          "Task 3",
          "Task 4",
          "Task 5",
        ]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-02][AC-03] a tick-off moves an occurrence into Recent activity as Done, naming the actor", async () => {
      const s = await seed();
      try {
        const { client, cookieStore } = await signIn(s.helen.email);
        const anchor = at(-2 * DAY);
        const event = await client
          .from("care_events")
          .insert({ client_id: s.clientId, title: "Wound dressing", starts_at: anchor })
          .select("id")
          .single();
        expect(event.error).toBeNull();

        const tick = await client.rpc("set_occurrence_done", {
          p_event_id: event.data!.id,
          p_original_start: anchor,
        });
        expect(tick.error).toBeNull();

        const done = await taskLogAs(cookieStore, s.clientId, { status: "done" });
        expect(done.items).toHaveLength(1);
        expect(done.items[0]).toMatchObject({
          title: "Wound dressing",
          status: "done",
          actor: "Helen Doyle",
        });
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-02][Scope] another client's family reads no rows for Margaret's task log (RLS)", async () => {
      const s = await seed();
      try {
        const { client: helenClient } = await signIn(s.helen.email);
        await helenClient.from("care_events").insert({
          client_id: s.clientId,
          title: "Private",
          starts_at: at(-DAY),
        });

        const { cookieStore: rosaSession } = await signIn(s.rosa.email);
        const rows = await taskLogAs(rosaSession, s.clientId, { status: "overdue" });
        expect(rows).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });
      } finally {
        await cleanUp(s);
      }
    });
  },
);
