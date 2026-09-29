// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied). Skips against a
// hosted project, exactly as tests/integration/family-home-budget-strip.test.ts does.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `adm-04-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  lastName: string,
  role: "family" | "admin",
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
    last_name: lastName,
    email,
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/**
 * Margaret (org A) has one family member, Helen. Robert (org A) has none (the "—" case). Org B has
 * its own client, purely to give AC-02 something real to exclude.
 */
async function seed() {
  const admin = createAdminClient();
  const orgA = await admin
    .from("organisations")
    .insert({ name: unique("org-a") })
    .select("id")
    .single();
  const orgB = await admin
    .from("organisations")
    .insert({ name: unique("org-b") })
    .select("id")
    .single();
  if (orgA.error || !orgA.data || orgB.error || !orgB.data) throw new Error("orgs");

  const priya = await createUser("Priya", "Nair", "admin", orgA.data.id);
  const helen = await createUser("Helen", "Doyle", "family", null);

  const margaret = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: orgA.data.id })
    .select("id")
    .single();
  const robert = await admin
    .from("clients")
    .insert({ first_name: "Robert", last_name: unique("client"), organisation_id: orgA.data.id })
    .select("id")
    .single();
  const otherOrgClient = await admin
    .from("clients")
    .insert({ first_name: "Yiannis", last_name: unique("client"), organisation_id: orgB.data.id })
    .select("id")
    .single();
  if (
    margaret.error ||
    !margaret.data ||
    robert.error ||
    !robert.data ||
    otherOrgClient.error ||
    !otherOrgClient.data
  ) {
    throw new Error("clients");
  }

  await admin
    .from("client_family_members")
    .insert({ client_id: margaret.data.id, profile_id: helen.userId });

  return {
    admin,
    orgAId: orgA.data.id,
    orgBId: orgB.data.id,
    priya,
    helen,
    margaretId: margaret.data.id,
    robertId: robert.data.id,
    otherOrgClientId: otherOrgClient.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.priya, s.helen]) {
    await s.admin.auth.admin.deleteUser(user.userId);
  }
  await s.admin.from("clients").delete().in("id", [s.margaretId, s.robertId, s.otherOrgClientId]);
  await s.admin.from("organisations").delete().in("id", [s.orgAId, s.orgBId]);
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

async function clientsAs(session: Map<string, string>) {
  return withSession(session, async () => {
    const { getAdminClients } = await import("@/server/admin/clients-queries");
    return getAdminClients();
  });
}

describe.skipIf(!hasLocalSupabase)("[ADM-04] Admin Clients against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[ADM-04][AC-01] T-01 lists the organisation's clients with their family contact's full name", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const data = await clientsAs(cookieStore);

      expect(data.clients).toContainEqual(
        expect.objectContaining({
          id: s.margaretId,
          name: expect.stringContaining("Margaret"),
          familyContact: "Helen Doyle",
        }),
      );
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-04][PRD] a client with no linked family member shows '—'", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const data = await clientsAs(cookieStore);

      expect(data.clients).toContainEqual(
        expect.objectContaining({ id: s.robertId, familyContact: "—" }),
      );
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-04][AC-02] T-02 another organisation's clients are never included", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const data = await clientsAs(cookieStore);

      expect(data.clients.some((client) => client.id === s.otherOrgClientId)).toBe(false);
      expect(data.clients).toHaveLength(2);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-04][AC-03] T-03 an organisation with no clients returns an empty array", async () => {
    const s = await seed();
    const rita = await createUser("Rita", "Cole", "admin", s.orgBId);
    try {
      // orgB has its own client (otherOrgClientId), so remove it first to test the true empty case.
      await s.admin.from("clients").delete().eq("id", s.otherOrgClientId);
      const { cookieStore } = await signIn(rita.email);

      const data = await clientsAs(cookieStore);

      expect(data.clients).toEqual([]);
    } finally {
      await s.admin.auth.admin.deleteUser(rita.userId);
      await cleanUp(s);
    }
  });
});
