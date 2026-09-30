// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied).
// These tests create and delete organisations, users, clients and shifts, and
// they need this feature's migration (`carer_notifications`), so they run only when NEXT_PUBLIC_SUPABASE_URL is
// a local address and skip against a hosted project. If `.env.local` points at a hosted
// project, override the three variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `car-02-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

/** Melbourne is UTC+11 on these dates (AEDT until 7 April 2030). */
const TUE = { start: "2030-03-05T09:00:00+11:00", end: "2030-03-05T11:00:00+11:00" };
const WED = { start: "2030-03-06T13:00:00+11:00", end: "2030-03-06T17:00:00+11:00" };

async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("banksia") })
    .select("id");
  if (org.error || !org.data?.[0]) throw org.error ?? new Error("org");
  const orgId = org.data[0].id;
  const aisha = await createUser("aisha", "carer", orgId);
  const daniel = await createUser("daniel", "carer", orgId);
  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: "Doyle", organisation_id: orgId })
    .select("id");
  if (client.error || !client.data?.[0]) throw client.error ?? new Error("client");
  const clientId = client.data[0].id;

  // The service role inserts, as the admin app will: the trigger writes the notifications.
  const insert = (carer: { userId: string }, w: { start: string; end: string }) =>
    admin.from("shifts").insert({
      client_id: clientId,
      carer_id: carer.userId,
      starts_at: new Date(w.start).toISOString(),
      ends_at: new Date(w.end).toISOString(),
    });
  for (const [carer, w] of [
    [aisha, TUE],
    [aisha, WED],
    [daniel, TUE],
  ] as const) {
    const { error } = await insert(carer, w);
    if (error) throw error;
  }
  return { admin, orgId, aisha, daniel, clientId };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.aisha, s.daniel]) await s.admin.auth.admin.deleteUser(user.userId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

describe.skipIf(!hasLocalSupabase)("[CAR-02] carer notifications against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[CAR-02][AC-10] getCarerNotifications returns only Aisha's two, newest first, unread, with the message", async () => {
    const s = await seed();
    try {
      const session = await signedInAs(s.aisha.email);

      const rows = await withSession(session, async () => {
        const { getCarerNotifications } = await import("@/server/notifications/queries");
        return getCarerNotifications(s.aisha.userId);
      });

      expect(rows).toHaveLength(2);
      expect(rows.every((row) => row.carerId === s.aisha.userId && !row.read)).toBe(true);
      expect(rows.every((row) => row.source === "admin")).toBe(true);
      const times = rows.map((row) => Date.parse(row.createdAt));
      expect(times).toEqual([...times].sort((a, b) => b - a));
      expect(rows.map((row) => row.message).sort()).toEqual([
        "New shift assigned: Tuesday 5 Mar, 09:00–11:00 (Margaret Doyle).",
        "New shift assigned: Wednesday 6 Mar, 13:00–17:00 (Margaret Doyle).",
      ]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-02][AC-10] getCarerUnreadCount is 2 for Aisha and 1 for Daniel", async () => {
    const s = await seed();
    try {
      const count = async (carer: { email: string; userId: string }) =>
        withSession(await signedInAs(carer.email), async () => {
          const { getCarerUnreadCount } = await import("@/server/notifications/queries");
          return getCarerUnreadCount(carer.userId);
        });

      expect(await count(s.aisha)).toBe(2);
      expect(await count(s.daniel)).toBe(1);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-02][AC-10] markCarerNotificationsRead marks only the caller's rows", async () => {
    const s = await seed();
    try {
      const result = await withSession(await signedInAs(s.aisha.email), async () => {
        const { markCarerNotificationsRead } = await import("@/server/notifications/actions");
        return markCarerNotificationsRead();
      });

      expect(result).toEqual({ ok: true, data: undefined });
      const rows = await s.admin
        .from("carer_notifications")
        .select("recipient_id, read_at")
        .in("recipient_id", [s.aisha.userId, s.daniel.userId]);
      expect(rows.error).toBeNull();
      const readFor = (id: string) =>
        rows.data!.filter((row) => row.recipient_id === id).map((row) => row.read_at !== null);
      expect(readFor(s.aisha.userId)).toEqual([true, true]);
      expect(readFor(s.daniel.userId)).toEqual([false]);

      // Once read, the contract reports read rows and a zero count.
      const after = await withSession(await signedInAs(s.aisha.email), async () => {
        const { getCarerNotifications, getCarerUnreadCount } = await import(
          "@/server/notifications/queries"
        );
        return {
          rows: await getCarerNotifications(s.aisha.userId),
          unread: await getCarerUnreadCount(s.aisha.userId),
        };
      });
      expect(after.unread).toBe(0);
      expect(after.rows.every((row) => row.read)).toBe(true);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-02][AC-05] Daniel's session never returns Aisha's notifications, whatever id is asked for", async () => {
    const s = await seed();
    try {
      const rows = await withSession(await signedInAs(s.daniel.email), async () => {
        const { getCarerNotifications } = await import("@/server/notifications/queries");
        return getCarerNotifications(s.aisha.userId);
      });

      expect(rows).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });
});
