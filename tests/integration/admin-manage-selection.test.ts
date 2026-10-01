// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpIfAdmin } from "../helpers/aal2";

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
  return `adm-06-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  // Own organisation: two active carers, one deactivated carer. Other organisation: a carer whose
  // name also matches the 'Sar' search, so a leak would show up in AC-03/AC-04.
  const sarah = await createUser("Sarah", "Nguyen", "carer", orgA.data.id);
  const aisha = await createUser("Aisha", "Rahman", "carer", orgA.data.id);
  const dormant = await createUser("Sarita", "Old", "carer", orgA.data.id);
  const otherCarer = await createUser("Sara", "Other", "carer", orgB.data.id);
  const carers = [sarah, aisha, dormant, otherCarer];
  const off = await admin.from("profiles").update({ is_active: false }).eq("id", dormant.userId);
  if (off.error) throw off.error;

  const margaret = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: "Doyle", organisation_id: orgA.data.id })
    .select("id")
    .single();
  const otherClient = await admin
    .from("clients")
    .insert({ first_name: "Margot", last_name: "Elsewhere", organisation_id: orgB.data.id })
    .select("id")
    .single();
  if (margaret.error || !margaret.data || otherClient.error || !otherClient.data)
    throw new Error("clients");

  return {
    admin,
    orgAId: orgA.data.id,
    orgBId: orgB.data.id,
    priya,
    carers,
    margaretId: margaret.data.id,
    otherClientId: otherClient.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.from("clients").delete().in("id", [s.margaretId, s.otherClientId]);
  for (const userId of [s.priya.userId, ...s.carers.map((c) => c.userId)]) {
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
  // F0-21: admin RLS needs an AAL2 session, as a real admin has after TOTP.
  await stepUpIfAdmin(client);
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

async function manageAs(
  session: Map<string, string>,
  params?: { staffSearch?: string; clientSearch?: string },
) {
  return withSession(session, async () => {
    const { getAdminManage } = await import("@/server/admin/manage-queries");
    return getAdminManage(params);
  });
}

describe.skipIf(!hasLocalSupabase)("[ADM-06] Admin Manage against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[ADM-06][AC-03] T-03 a staff search of 'Sar' lists only Sarah Nguyen", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);
      const data = await manageAs(cookieStore, { staffSearch: "Sar" });
      expect(data.staff.map((person) => person.name)).toEqual(["Sarah Nguyen"]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-06][AC-03] T-03 a client search filters the clients and leaves staff untouched", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);
      const data = await manageAs(cookieStore, { clientSearch: "marg" });
      expect(data.clients).toEqual([{ id: s.margaretId, name: "Margaret Doyle" }]);
      expect(data.staff.map((person) => person.name).sort()).toEqual([
        "Aisha Rahman",
        "Sarah Nguyen",
      ]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-06][AC-04] T-04 another organisation's staff and clients are absent", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);
      const data = await manageAs(cookieStore);
      const staffNames = data.staff.map((person) => person.name);
      expect(staffNames).not.toContain("Sara Other");
      expect(data.clients.map((person) => person.id)).not.toContain(s.otherClientId);
      expect(data.clients.map((person) => person.id)).toContain(s.margaretId);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-06][AC-06] T-08 a deactivated carer in the admin's own organisation is absent", async () => {
    const s = await seed();
    try {
      const { cookieStore } = await signIn(s.priya.email);
      const data = await manageAs(cookieStore);
      const names = data.staff.map((person) => person.name);
      expect(names).not.toContain("Sarita Old");
      expect(names).toContain("Aisha Rahman");
    } finally {
      await cleanUp(s);
    }
  });
});
