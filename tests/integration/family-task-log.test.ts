// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

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

function unique(label: string) {
  return `fam-14-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw new Error("client");

  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.userId });

  return { admin, orgId: org.data.id, helen, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.auth.admin.deleteUser(s.helen.userId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
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
  query: { q?: string; status?: "planned" | "done" | "overdue"; page?: number } = {},
) {
  return withSession(session, async () => {
    const { getTaskLog } = await import("@/server/events/queries");
    return getTaskLog(clientId, query);
  });
}

function melbourneDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(date);
}

describe.skipIf(!hasLocalSupabase)("[FAM-14] Family — Task log against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[FAM-14][AC-05] T-05 a weekly event extending forever never returns an occurrence after today", async () => {
    const s = await seed();
    try {
      const { client, cookieStore } = await signIn(s.helen.email);
      const title = unique("weekly-weigh-in");
      // Anchored three weeks before now: enough weekly occurrences to include one at or near
      // today, with none yet generated for next week, so the assertion below is meaningful
      // (not vacuously true from an empty result).
      const anchor = new Date(Math.floor((Date.now() - 21 * 24 * 60 * 60 * 1000) / 1000) * 1000);
      const created = await client.from("care_events").insert({
        client_id: s.clientId,
        title,
        starts_at: anchor.toISOString(),
        duration_minutes: 15,
        recurrence: { frequency: "weekly", interval: 1 },
      });
      expect(created.error).toBeNull();

      const result = await taskLogAs(cookieStore, s.clientId, { q: title });

      expect(result.items.length).toBeGreaterThan(0);
      const today = melbourneDay(new Date());
      for (const item of result.items) {
        expect(melbourneDay(new Date(item.start)) <= today).toBe(true);
      }
    } finally {
      await cleanUp(s);
    }
  });

  it("[FAM-14][Scope] another client's family reads an empty task log for Margaret (RLS)", async () => {
    const s = await seed();
    try {
      const { client: helenClient } = await signIn(s.helen.email);
      await helenClient.from("care_events").insert({
        client_id: s.clientId,
        title: "Private task",
        starts_at: new Date(Math.floor(Date.now() / 1000) * 1000).toISOString(),
      });

      const rosa = await createUser("Rosa");
      const { cookieStore: rosaSession } = await signIn(rosa.email);
      const result = await taskLogAs(rosaSession, s.clientId);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      await s.admin.auth.admin.deleteUser(rosa.userId);
    } finally {
      await cleanUp(s);
    }
  });
});
