// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied).
// These tests create, change and delete users, and they need the FAM-12
// migration (ADM-10 adds none), so they run only when NEXT_PUBLIC_SUPABASE_URL is a local address and
// skip against a hosted project. If `.env.local` points at a hosted project,
// override the three variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

const ORG_NAME = "ADM-10 test organisation";

async function createAdmin(label: string) {
  const service = createAdminClient();
  const { data: org, error: orgError } = await service
    .from("organisations")
    .insert({
      name: `${ORG_NAME} ${label}`,
      abn: "54 123 456 789",
      phone: "03 9555 0102",
      address: "220 High St, Preston VIC 3072",
    })
    .select("id")
    .single();
  if (orgError || !org) throw orgError ?? new Error("failed to create the test organisation");

  const email = `adm-10-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("failed to create the test user");

  const { error: profileError } = await service.from("profiles").insert({
    id: data.user.id,
    role: "admin",
    organisation_id: org.id,
    first_name: "Priya",
    last_name: "Nair",
    email,
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, organisationId: org.id, email };
}

async function deleteAdmin(carer: { userId: string; organisationId: string }) {
  const service = createAdminClient();
  await service.auth.admin.deleteUser(carer.userId);
  await service.from("organisations").delete().eq("id", carer.organisationId);
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

/** Binds the app's `next/headers` cookies to the jar a `cookieClient()` signed in on. */
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

describe.skipIf(!hasLocalSupabase)("[ADM-10] admin settings against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  async function signIn(a: { email: string }) {
    const cookieStore = new Map<string, string>();
    const { error } = await cookieClient(cookieStore).auth.signInWithPassword({
      email: a.email,
      password: PASSWORD,
    });
    expect(error).toBeNull();
    return cookieStore;
  }

  it("[ADM-10][AC-01] the contract returns the admin's own organisation", async () => {
    const priya = await createAdmin("read");
    try {
      const cookieStore = await signIn(priya);
      const settings = await withSession(cookieStore, async () => {
        const { getAdminSettings } = await import("@/server/admin/settings-queries");
        return getAdminSettings();
      });
      expect(settings.organisation).toEqual({
        name: `${ORG_NAME} read`,
        abn: "54 123 456 789",
        phone: "03 9555 0102",
        address: "220 High St, Preston VIC 3072",
      });
    } finally {
      await deleteAdmin(priya);
    }
  });

  it("[ADM-10][AC-04] a saved change reads back through the contract", async () => {
    const priya = await createAdmin("save");
    try {
      const cookieStore = await signIn(priya);
      const saved = await withSession(cookieStore, async () => {
        const { updateOrganisationSettings } = await import("@/server/admin/settings-actions");
        return updateOrganisationSettings({
          name: "Banksia Care",
          abn: "54123456789",
          phone: "03 9555 0199",
          address: "5 High St, Preston VIC 3072",
        });
      });
      expect(saved.ok).toBe(true);

      const after = await withSession(cookieStore, async () => {
        const { getAdminSettings } = await import("@/server/admin/settings-queries");
        return getAdminSettings();
      });
      expect(after.organisation).toEqual({
        name: "Banksia Care",
        abn: "54 123 456 789",
        phone: "03 9555 0199",
        address: "5 High St, Preston VIC 3072",
      });
    } finally {
      await deleteAdmin(priya);
    }
  });

  it("[ADM-10][AC-03] through the real API a direct table update changes nothing", async () => {
    const priya = await createAdmin("rls");
    try {
      const client = cookieClient(await signIn(priya));
      const result = await client
        .from("organisations")
        .update({ name: "Hacked" })
        .eq("id", priya.organisationId)
        .select();
      expect(result.error).not.toBeNull();
      const { data: row } = await createAdminClient()
        .from("organisations")
        .select("name")
        .eq("id", priya.organisationId)
        .single();
      expect(row?.name).toBe(`${ORG_NAME} rls`);
    } finally {
      await deleteAdmin(priya);
    }
  });

  it("[ADM-10][AC-05] a signed-out save is refused", async () => {
    const result = await withSession(new Map(), async () => {
      const { updateOrganisationSettings } = await import("@/server/admin/settings-actions");
      return updateOrganisationSettings({
        name: "Nobody",
        abn: "54123456789",
        phone: "03 9555 0102",
        address: "1 High St",
      });
    });
    expect(result.ok).toBe(false);
  });
});
