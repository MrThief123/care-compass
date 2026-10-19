// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// [F0-29] Tags against a real database: Helen tags events through createEvent, the Task log
// filters by tag over the whole history, an assigned carer reads the tags and the filter but
// cannot tag (`set_event_tags`, family only). Documents are covered by supabase/tests/tags.test.sql
// (a document row cannot be deleted, so it would outlive this test). Needs a running local
// Supabase stack; runs only when NEXT_PUBLIC_SUPABASE_URL is a local address.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `f0-29-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    first_name: role === "carer" ? "Aisha" : "Helen",
    last_name: role === "carer" ? "Rahman" : "Doyle",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/** Margaret (Helen's), and Aisha, a carer on shift with her now. */
async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("org") })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");
  const helen = await createUser("helen", "family", null);
  const aisha = await createUser("aisha", "carer", org.data.id);
  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.userId });
  const shift = await admin.from("shifts").insert({
    client_id: client.data.id,
    carer_id: aisha.userId,
    starts_at: new Date(Date.now() - 3_600_000).toISOString(),
    ends_at: new Date(Date.now() + 3_600_000).toISOString(),
  });
  if (shift.error) throw shift.error;
  return { admin, orgId: org.data.id, helen, aisha, clientId: client.data.id };
}
type Seed = Awaited<ReturnType<typeof seed>>;

async function cleanUp(s: Seed) {
  for (const user of [s.helen, s.aisha]) await s.admin.auth.admin.deleteUser(user.userId);
  await s.admin.from("shifts").delete().eq("client_id", s.clientId);
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

const EVENT = {
  description: "",
  date: "2026-09-01",
  startTime: "09:00",
  durationMinutes: 30,
  isTask: true,
} as const;

describe.skipIf(!hasLocalSupabase)("[F0-29] Tags against local Supabase", () => {
  it("[F0-29][AC-01][AC-07][AC-05] T-08 Helen tags events, the log filters, Aisha reads but cannot tag", async () => {
    const s = await seed();
    try {
      const helen = await signIn(s.helen.email);
      const { gp, all, doctors, tags } = await withSession(helen, async () => {
        const { createEvent } = await import("@/server/events/actions");
        const { getTaskLog } = await import("@/server/events/queries");
        const { getClientTags, getEventTags } = await import("@/server/tags/queries");
        const gp = await createEvent({
          ...EVENT,
          clientId: s.clientId,
          title: "GP visit",
          recurrence: "weekly",
          tags: ["Doctors"],
        });
        await createEvent({
          ...EVENT,
          clientId: s.clientId,
          title: "Walk",
          recurrence: "daily",
          tags: ["Exercise"],
        });
        const gpId = gp.ok ? gp.data.eventId : "";
        return {
          gp: { result: gp, tags: await getEventTags(s.clientId, gpId) },
          all: await getTaskLog(s.clientId, {}),
          doctors: await getTaskLog(s.clientId, { tag: "doctors" }),
          tags: await getClientTags(s.clientId),
        };
      });
      expect(gp.result.ok).toBe(true);
      expect(gp.tags).toEqual(["Doctors"]);
      expect(tags).toEqual(["Doctors", "Exercise"]);
      expect(doctors.total).toBeGreaterThan(0);
      expect(doctors.total).toBeLessThan(all.total);
      expect(doctors.items.every((row) => row.title === "GP visit")).toBe(true);

      const aisha = await signIn(s.aisha.email);
      const asCarer = await withSession(aisha, async () => {
        const { getTaskLog } = await import("@/server/events/queries");
        const { getClientTags } = await import("@/server/tags/queries");
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const gpId = gp.result.ok ? gp.result.data.eventId : "";
        const refused = await supabase.rpc("set_event_tags", {
          p_event_id: gpId,
          p_names: ["Carer tag"],
        });
        return {
          tags: await getClientTags(s.clientId),
          doctors: await getTaskLog(s.clientId, { tag: "Doctors" }),
          refusedCode: refused.error?.code,
        };
      });
      expect(asCarer.tags).toEqual(["Doctors", "Exercise"]);
      expect(asCarer.doctors.total).toBe(doctors.total);
      expect(asCarer.refusedCode).toBe("42501");
    } finally {
      await cleanUp(s);
    }
  });
});
