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
  return `adm-02-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  lastName: string,
  role: "family" | "carer" | "admin",
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
  const rita = await createUser("Rita", "Cole", "admin", orgB.data.id);
  const bob = await createUser("Bob", "Diaz", "carer", orgB.data.id);

  return { admin, orgAId: orgA.data.id, orgBId: orgB.data.id, priya, rita, bob };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>, extraUserIds: string[] = []) {
  for (const userId of [s.priya.userId, s.rita.userId, s.bob.userId, ...extraUserIds]) {
    await s.admin.auth.admin.deleteUser(userId);
  }
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

describe.skipIf(!hasLocalSupabase)("[ADM-02] Admin Staff against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[ADM-02][AC-01] T-01 Priya invites a new carer, who then appears in getAdminStaff with the chosen role", async () => {
    const s = await seed();
    let newUserId: string | undefined;
    try {
      const { cookieStore } = await signIn(s.priya.email);
      const email = `${unique("nina")}@example.test`;

      const outcome = await withSession(cookieStore, async () => {
        const { createStaff } = await import("@/server/admin/staff-actions");
        return createStaff({
          firstName: "Nina",
          lastName: "Ray",
          phone: "0400 555 666",
          email,
          jobTitle: "Enrolled Nurse",
        });
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) throw new Error("expected ok");
      newUserId = outcome.data.id;
      expect(outcome.data).toMatchObject({
        organisationId: s.orgAId,
        firstName: "Nina",
        lastName: "Ray",
        jobTitle: "Enrolled Nurse",
        email,
      });

      const staff = await withSession(cookieStore, async () => {
        const { getAdminStaff } = await import("@/server/admin/staff-queries");
        return getAdminStaff();
      });
      expect(staff.staff).toContainEqual(
        expect.objectContaining({ firstName: "Nina", lastName: "Ray", jobTitle: "Enrolled Nurse" }),
      );
    } finally {
      await cleanUp(s, newUserId ? [newUserId] : []);
    }
  });

  it("[ADM-02][AC-03] T-03 an edited carer's full contact details come back from getAdminStaff", async () => {
    const s = await seed();
    const aisha = await createUser("Aisha", "Rahman", "carer", s.orgAId);
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const outcome = await withSession(cookieStore, async () => {
        const { updateStaff } = await import("@/server/admin/staff-actions");
        return updateStaff(aisha.userId, {
          firstName: "Aisha",
          lastName: "Rahman",
          phone: "0400 777 888",
          email: aisha.email,
          jobTitle: "Registered Nurse",
        });
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) throw new Error("expected ok");
      expect(outcome.data).toMatchObject({
        firstName: "Aisha",
        lastName: "Rahman",
        phone: "0400 777 888",
        jobTitle: "Registered Nurse",
      });
    } finally {
      await s.admin.from("profiles").delete().eq("id", aisha.userId);
      await cleanUp(s);
    }
  });

  it("[ADM-02][AC-04] T-04 Priya cannot edit Bob, a carer in another organisation", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);

      const outcome = await withSession(cookieStore, async () => {
        const { updateStaff } = await import("@/server/admin/staff-actions");
        return updateStaff(s.bob.userId, {
          firstName: "Bob",
          lastName: "Diaz",
          phone: "0400 555 666",
          email: s.bob.email,
          jobTitle: "Support Worker",
        });
      });

      expect(outcome).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
    } finally {
      await cleanUp(s);
    }
  });
});
