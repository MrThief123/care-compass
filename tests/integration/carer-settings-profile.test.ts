// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied).
// These tests create, change and delete users, and they need the FAM-12
// migration (CAR-09 adds none), so they run only when NEXT_PUBLIC_SUPABASE_URL is a local address and
// skip against a hosted project. If `.env.local` points at a hosted project,
// override the three variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

const ORG_NAME = "CAR-09 test organisation";

async function createCarer(label: string) {
  const admin = createAdminClient();
  const { data: org, error: orgError } = await admin
    .from("organisations")
    .insert({ name: `${ORG_NAME} ${label}` })
    .select("id")
    .single();
  if (orgError || !org) throw orgError ?? new Error("failed to create the test organisation");

  const email = `car-09-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("failed to create the test user");

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role: "carer",
    organisation_id: org.id,
    first_name: "Aisha",
    last_name: "Rahman",
    phone: "0423 987 654",
    email,
    job_title: "Registered Nurse",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, organisationId: org.id, email };
}

async function deleteCarer(carer: { userId: string; organisationId: string }) {
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(carer.userId);
  await admin.from("organisations").delete().eq("id", carer.organisationId);
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

describe.skipIf(!hasLocalSupabase)("[CAR-09] carer settings against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  async function signIn(carer: { email: string }) {
    const cookieStore = new Map<string, string>();
    const { error } = await cookieClient(cookieStore).auth.signInWithPassword({
      email: carer.email,
      password: PASSWORD,
    });
    expect(error).toBeNull();
    return cookieStore;
  }

  it("[CAR-09][AC-01] the contract returns Aisha's name, phone, contact email and job title as her Role", async () => {
    const aisha = await createCarer("read");
    try {
      const cookieStore = await signIn(aisha);

      const details = await withSession(cookieStore, async () => {
        const { getCarerContactDetails } = await import("@/server/profiles/queries");
        return getCarerContactDetails(aisha.userId);
      });

      expect(details).toEqual({
        profileId: aisha.userId,
        name: "Aisha Rahman",
        phone: "0423 987 654",
        email: aisha.email,
        role: "Registered Nurse",
      });
    } finally {
      await deleteCarer(aisha);
    }
  });

  it("[CAR-09][AC-04] a saved name and phone read back through the contract; job title and login email are unchanged", async () => {
    const aisha = await createCarer("save");
    try {
      const cookieStore = await signIn(aisha);

      const saved = await withSession(cookieStore, async () => {
        const { updateCarerContactDetails } = await import("@/server/profiles/actions");
        return updateCarerContactDetails({
          name: "Aisha Rahman-Lee",
          phone: "0499 111 222",
          email: "aisha.contact@example.test",
        });
      });
      expect(saved.ok).toBe(true);

      // A fresh read, as after a reload.
      const after = await withSession(cookieStore, async () => {
        const { getCarerContactDetails } = await import("@/server/profiles/queries");
        return getCarerContactDetails(aisha.userId);
      });
      expect(after).toEqual({
        profileId: aisha.userId,
        name: "Aisha Rahman-Lee",
        phone: "0499 111 222",
        email: "aisha.contact@example.test",
        role: "Registered Nurse",
      });

      const { data: row } = await createAdminClient()
        .from("profiles")
        .select("job_title, role, address")
        .eq("id", aisha.userId)
        .single();
      expect(row).toEqual({ job_title: "Registered Nurse", role: "carer", address: null });

      // The contact email is not the login email (PD-054).
      const { data: authUser } = await createAdminClient().auth.admin.getUserById(aisha.userId);
      expect(authUser.user?.email).toBe(aisha.email);
    } finally {
      await deleteCarer(aisha);
    }
  });

  it("[CAR-09][AC-02] through the real API Aisha cannot change her job title or role, and nothing changes", async () => {
    const aisha = await createCarer("rls");
    try {
      const cookieStore = await signIn(aisha);
      const client = cookieClient(cookieStore);

      const jobTitle = await client
        .from("profiles")
        .update({ job_title: "Nurse Practitioner" })
        .eq("id", aisha.userId)
        .select();
      expect(jobTitle.error).not.toBeNull();

      const role = await client
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", aisha.userId)
        .select();
      expect(role.error).not.toBeNull();

      const { data: row } = await createAdminClient()
        .from("profiles")
        .select("job_title, role")
        .eq("id", aisha.userId)
        .single();
      expect(row).toEqual({ job_title: "Registered Nurse", role: "carer" });
    } finally {
      await deleteCarer(aisha);
    }
  });

  it("[CAR-09][AC-05] the save and reset actions refuse, and change nothing, when nobody is signed in", async () => {
    const signedOut = await withSession(new Map(), async () => {
      const { updateCarerContactDetails, requestOwnPasswordReset } = await import(
        "@/server/profiles/actions"
      );
      return {
        save: await updateCarerContactDetails({
          name: "Aisha Rahman",
          phone: "0423 987 654",
          email: "aisha@example.test",
        }),
        reset: await requestOwnPasswordReset(),
      };
    });
    expect(signedOut.save.ok).toBe(false);
    expect(signedOut.reset.ok).toBe(false);
  });
});
