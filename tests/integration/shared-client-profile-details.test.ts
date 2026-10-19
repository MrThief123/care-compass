// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// [F0-28] Client personal details against a real database: family sign-up saves them, Helen
// edits them from Settings and the header follows, an assigned carer reads them, and a carer
// cannot save them (`save_client_details`, family only). Needs a running local Supabase stack
// (`supabase start`, migrations applied); runs only when NEXT_PUBLIC_SUPABASE_URL is a local
// address and skips against a hosted project.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

const DETAILS = {
  dateOfBirth: "1952-03-02",
  email: "margaret@example.test",
  phone: "0400 111 222",
  address: "12 Banksia Street",
  suburb: "Brunswick",
  emergencyContactName: "Helen Doyle",
  emergencyContactRelationship: "Daughter",
  emergencyContactPhone: "+61 400 333 444",
};

function unique(label: string) {
  return `f0-28-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  label: string,
  role: "family" | "carer",
  firstName: string,
  organisationId: string | null,
) {
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
    first_name: firstName,
    last_name: role === "carer" ? "Rahman" : "Doyle",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/** Margaret (Helen's), and Aisha, a carer with an upcoming shift with her. */
async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("org") })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");
  const helen = await createUser("helen", "family", "Helen", null);
  const aisha = await createUser("aisha", "carer", "Aisha", org.data.id);
  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.userId });
  // An upcoming shift is what makes Aisha Margaret's assigned carer (is_assigned_carer).
  const shift = await admin.from("shifts").insert({
    client_id: client.data.id,
    carer_id: aisha.userId,
    starts_at: new Date(Date.now() + 24 * 3_600_000).toISOString(),
    ends_at: new Date(Date.now() + 26 * 3_600_000).toISOString(),
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

async function storedDetails(s: Seed) {
  const { data } = await s.admin
    .from("clients")
    .select("date_of_birth, email, phone, address, suburb, emergency_contact_name")
    .eq("id", s.clientId)
    .single();
  return data;
}

describe.skipIf(!hasLocalSupabase)("[F0-28] Client personal details against local Supabase", () => {
  it("[F0-28][AC-03] T-08 family sign-up saves the details given", async () => {
    const admin = createAdminClient();
    const store = new Map<string, string>();
    const email = `${unique("signup")}@example.test`;
    const result = await withSession(store, async () => {
      const { signUp } = await import("@/server/auth/actions");
      return signUp({
        accountType: "family",
        firstName: "Helen",
        lastName: "Doyle",
        email,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        clientFirstName: "Margaret",
        clientLastName: unique("client"),
        clientDateOfBirth: DETAILS.dateOfBirth,
        clientPhone: DETAILS.phone,
        clientSuburb: DETAILS.suburb,
        clientEmergencyContactName: DETAILS.emergencyContactName,
      });
    });
    const { data: user } = await cookieClient(store).auth.getUser();
    const userId = user.user?.id;
    try {
      expect(result.ok).toBe(true);
      const { data: link } = await admin
        .from("client_family_members")
        .select("client_id")
        .eq("profile_id", userId!)
        .single();
      const { data: client } = await admin
        .from("clients")
        .select("date_of_birth, phone, suburb, emergency_contact_name, email")
        .eq("id", link!.client_id)
        .single();
      expect(client).toEqual({
        date_of_birth: "1952-03-02",
        phone: "0400 111 222",
        suburb: "Brunswick",
        emergency_contact_name: "Helen Doyle",
        email: null,
      });
      await admin.from("clients").delete().eq("id", link!.client_id);
    } finally {
      if (userId) await admin.auth.admin.deleteUser(userId);
    }
  });

  it("[F0-28][AC-07][AC-14] T-08 Helen saves from Settings; the details and the header follow", async () => {
    const s = await seed();
    try {
      const helen = await signIn(s.helen.email);
      const { saved, details, header } = await withSession(helen, async () => {
        const { saveClientDetails } = await import("@/server/clients/client-details-actions");
        const { getClientDetails } = await import("@/server/clients/client-details");
        const { getClientHeaderSummary } = await import("@/server/clients/queries");
        const saved = await saveClientDetails(s.clientId, DETAILS);
        return {
          saved,
          details: await getClientDetails(s.clientId),
          header: await getClientHeaderSummary(s.clientId),
        };
      });
      expect(saved).toEqual({ ok: true, data: undefined });
      expect(details).toEqual(DETAILS);
      expect(header.suburb).toBe("Brunswick");
      expect(header.age).toBeGreaterThanOrEqual(74);

      const cleared = await withSession(helen, async () => {
        const { saveClientDetails } = await import("@/server/clients/client-details-actions");
        return saveClientDetails(s.clientId, { ...DETAILS, email: "", address: "" });
      });
      expect(cleared.ok).toBe(true);
      expect(await storedDetails(s)).toMatchObject({ email: null, address: null });
    } finally {
      await cleanUp(s);
    }
  });

  it("[F0-28][AC-12][AC-13] T-08 the assigned carer reads the details but cannot save them", async () => {
    const s = await seed();
    try {
      await s.admin
        .from("clients")
        .update({ phone: DETAILS.phone, suburb: DETAILS.suburb })
        .eq("id", s.clientId);
      const aisha = await signIn(s.aisha.email);
      const { read, save } = await withSession(aisha, async () => {
        const { saveClientDetails } = await import("@/server/clients/client-details-actions");
        const { getClientDetails } = await import("@/server/clients/client-details");
        return {
          read: await getClientDetails(s.clientId),
          save: await saveClientDetails(s.clientId, { ...DETAILS, phone: "0499 000 000" }),
        };
      });
      expect(read).toEqual({ phone: DETAILS.phone, suburb: DETAILS.suburb });
      expect(save).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
      expect(await storedDetails(s)).toMatchObject({ phone: DETAILS.phone, email: null });
    } finally {
      await cleanUp(s);
    }
  });
});
