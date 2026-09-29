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
const DAY = 24 * 3_600_000;

const at = (offsetMs: number) =>
  new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000).toISOString();

function unique(label: string) {
  return `fam-05-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(firstName: string, role: "family" | "carer" = "family") {
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
    organisation_id: null,
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

  const helen = await createUser("Helen");
  const rosa = await createUser("Rosa");

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw new Error("client");

  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.userId });

  return { admin, orgId: org.data.id, helen, rosa, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa]) await s.admin.auth.admin.deleteUser(user.userId);
  // A client with history (completions) cannot be deleted; ignore that error.
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

async function tickAs(session: Map<string, string>, key: string) {
  return withSession(session, async () => {
    const { setOccurrenceDone } = await import("@/server/events/actions");
    return setOccurrenceDone(key);
  });
}

async function untickAs(session: Map<string, string>, key: string) {
  return withSession(session, async () => {
    const { setOccurrenceUndone } = await import("@/server/events/actions");
    return setOccurrenceUndone(key);
  });
}

describe.skipIf(!hasLocalSupabase)(
  "[FAM-05] Family Calendar — Tasks panel and Log panel against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[FAM-05][AC-01] T-01 ticking a Planned task records the completion with the signed-in family member as actor", async () => {
      const s = await seed();
      try {
        const { client, cookieStore } = await signIn(s.helen.email);
        const anchor = at(-30 * 60_000);
        const event = await client
          .from("care_events")
          .insert({ client_id: s.clientId, title: "Physiotherapy", starts_at: anchor })
          .select("id")
          .single();
        expect(event.error).toBeNull();
        const key = `${event.data!.id}:${anchor}`;

        const result = await tickAs(cookieStore, key);

        expect(result.ok).toBe(true);
        if (result.ok) expect(result.data.actor).toBe("Helen Doyle");

        const completion = await s.admin
          .from("care_event_completions")
          .select("action, actor_display_name")
          .eq("event_id", event.data!.id)
          .order("seq", { ascending: false })
          .limit(1)
          .single();
        expect(completion.data).toMatchObject({
          action: "done",
          actor_display_name: "Helen Doyle",
        });
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-05][AC-01] undoing a Done task appends an 'undone' completion, and the family may undo it", async () => {
      const s = await seed();
      try {
        const { client, cookieStore } = await signIn(s.helen.email);
        const anchor = at(-DAY);
        const event = await client
          .from("care_events")
          .insert({ client_id: s.clientId, title: "Wound dressing", starts_at: anchor })
          .select("id")
          .single();
        expect(event.error).toBeNull();
        const key = `${event.data!.id}:${anchor}`;

        const tick = await tickAs(cookieStore, key);
        expect(tick.ok).toBe(true);

        const untick = await untickAs(cookieStore, key);
        expect(untick.ok).toBe(true);

        const rows = await s.admin
          .from("care_event_completions")
          .select("action")
          .eq("event_id", event.data!.id)
          .order("seq", { ascending: true });
        expect(rows.data?.map((row) => row.action)).toEqual(["done", "undone"]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-05][Scope] a family member of another client cannot tick off Margaret's task", async () => {
      const s = await seed();
      try {
        const { client: helenClient } = await signIn(s.helen.email);
        const anchor = at(-DAY);
        const event = await helenClient
          .from("care_events")
          .insert({ client_id: s.clientId, title: "Private", starts_at: anchor })
          .select("id")
          .single();
        expect(event.error).toBeNull();
        const key = `${event.data!.id}:${anchor}`;

        const { cookieStore: rosaSession } = await signIn(s.rosa.email);
        const result = await tickAs(rosaSession, key);

        expect(result).toMatchObject({
          ok: false,
          error: { code: "NOT_ALLOWED", message: "Not permitted to tick off this task." },
        });
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-05][Scope] an unknown occurrence key is refused as VALIDATION", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);
        const result = await tickAs(cookieStore, "not-a-valid-key");
        expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
      } finally {
        await cleanUp(s);
      }
    });
  },
);
