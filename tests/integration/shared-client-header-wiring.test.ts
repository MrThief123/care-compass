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
  return `f0-20-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const orgName = unique("org");
  const org = await admin.from("organisations").insert({ name: orgName }).select("id").single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const helen = await createUser("Helen");
  const rosa = await createUser("Rosa");
  const nina = await createUser("Nina");

  const client = await admin
    .from("clients")
    .insert({
      first_name: "Margaret",
      last_name: "Whitfield",
      date_of_birth: "1943-10-01",
      suburb: "Brunswick",
      organisation_id: org.data.id,
    })
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
    orgName,
    helen,
    rosa,
    nina,
    clientId: client.data.id,
    otherId: other.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa, s.nina]) await s.admin.auth.admin.deleteUser(user.userId);
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

async function asSession<T>(cookieStore: Map<string, string>, run: () => Promise<T>): Promise<T> {
  return withSession(cookieStore, run);
}

/** The path a redirect points at, as Next reports it: `NEXT_REDIRECT;replace;<url>;307;`. */
async function redirectTarget(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? "";
    expect(digest).toMatch(/^NEXT_REDIRECT;replace;/);
    return digest.split(";")[2]!;
  }
  throw new Error("expected a redirect");
}

describe.skipIf(!hasLocalSupabase)(
  "[F0-22] Client header and family route guard against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[F0-22][AC-01] Helen reads Margaret's header: names, age, suburb and organisation name", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const summary = await asSession(cookieStore, async () => {
          const { getClientHeaderSummary } = await import("@/server/clients/queries");
          return getClientHeaderSummary(s.clientId);
        });

        const { ageFromDob } = await import("@/lib/format/age");
        expect(summary).toEqual({
          id: s.clientId,
          firstName: "Margaret",
          lastName: "Whitfield",
          age: ageFromDob("1943-10-01"),
          suburb: "Brunswick",
          organisationName: s.orgName,
        });
      } finally {
        await cleanUp(s);
      }
    });

    it("[F0-22][AC-02] a client with no suburb, date of birth or organisation still loads", async () => {
      const s = await seed();
      try {
        const bare = await s.admin
          .from("clients")
          .insert({ first_name: "Bare", last_name: unique("client") })
          .select("id")
          .single();
        await s.admin
          .from("client_family_members")
          .insert({ client_id: bare.data!.id, profile_id: s.helen.userId });
        const { cookieStore } = await signIn(s.helen.email);

        const summary = await asSession(cookieStore, async () => {
          const { getClientHeaderSummary } = await import("@/server/clients/queries");
          return getClientHeaderSummary(bare.data!.id);
        });

        expect(summary).toMatchObject({ id: bare.data!.id, firstName: "Bare" });
        expect(summary).not.toHaveProperty("age");
        expect(summary).not.toHaveProperty("suburb");
        expect(summary).not.toHaveProperty("organisationName");
        await s.admin.from("clients").delete().eq("id", bare.data!.id);
      } finally {
        await cleanUp(s);
      }
    });

    it("[F0-22][AC-03] another family's client is unreadable and the error names nobody", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const error = await asSession(cookieStore, async () => {
          const { getClientHeaderSummary } = await import("@/server/clients/queries");
          return getClientHeaderSummary(s.otherId).catch((e: Error) => e);
        });

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("getClientHeaderSummary: could not load the client.");
        expect((error as Error).message).not.toMatch(/Robert|Margaret/);
      } finally {
        await cleanUp(s);
      }
    });

    it("[F0-22][AC-05] Helen opening Robert is redirected to her own client's home", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        const target = await asSession(cookieStore, async () => {
          const { assertClientAccess } = await import("@/server/clients/queries");
          return redirectTarget(() => assertClientAccess(s.otherId));
        });

        expect(target).toBe(`/family/${s.clientId}/home`);
      } finally {
        await cleanUp(s);
      }
    });

    it("[F0-22][AC-05] Helen opening Margaret is let through", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);

        await asSession(cookieStore, async () => {
          const { assertClientAccess } = await import("@/server/clients/queries");
          await expect(assertClientAccess(s.clientId)).resolves.toBeUndefined();
        });
      } finally {
        await cleanUp(s);
      }
    });

    it("[F0-22][AC-07] a family member with no linked client goes to /no-client-linked", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.nina.email);

        const target = await asSession(cookieStore, async () => {
          const { assertClientAccess } = await import("@/server/clients/queries");
          return redirectTarget(() => assertClientAccess(s.clientId));
        });

        expect(target).toBe("/no-client-linked");
      } finally {
        await cleanUp(s);
      }
    });
  },
);
