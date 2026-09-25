// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied)
// and `.env.local` populated from `supabase status` — same convention as
// shared-authentication.test.ts. Skips cleanly wherever that isn't set up.
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PASSWORD = "correct horse battery staple 1!";

async function createFamily(label: string) {
  const admin = createAdminClient();
  const email = `fam-12-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
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
    first_name: "Helen",
    last_name: "Doyle",
    phone: "0412 345 678",
    email,
    address: "12 Wattle St",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

async function deleteUser(userId: string) {
  await createAdminClient().auth.admin.deleteUser(userId);
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

describe.skipIf(!hasLocalSupabase)("[FAM-12] family settings against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[FAM-12][AC-01] a saved phone number is what the contract reads back afterwards", async () => {
    const helen = await createFamily("save");
    try {
      const cookieStore = new Map<string, string>();
      const { error } = await cookieClient(cookieStore).auth.signInWithPassword({
        email: helen.email,
        password: PASSWORD,
      });
      expect(error).toBeNull();

      const before = await withSession(cookieStore, async () => {
        const { getFamilyContactDetails } = await import("@/server/profiles/queries");
        return getFamilyContactDetails(helen.userId);
      });
      expect(before).toMatchObject({ name: "Helen Doyle", phone: "0412 345 678" });

      const saved = await withSession(cookieStore, async () => {
        const { updateFamilyContactDetails } = await import("@/server/profiles/actions");
        return updateFamilyContactDetails({
          name: "Helen Doyle",
          phone: "0499 111 222",
          email: helen.email,
          address: "1 New Rd, Preston VIC",
        });
      });
      expect(saved.ok).toBe(true);

      // A fresh read, as after a reload.
      const after = await withSession(cookieStore, async () => {
        const { getFamilyContactDetails } = await import("@/server/profiles/queries");
        return getFamilyContactDetails(helen.userId);
      });
      expect(after).toEqual({
        profileId: helen.userId,
        name: "Helen Doyle",
        phone: "0499 111 222",
        email: helen.email,
        address: "1 New Rd, Preston VIC",
      });

      // The login email is untouched by the contact email (PD-054).
      const { data: authUser } = await createAdminClient().auth.admin.getUserById(helen.userId);
      expect(authUser.user?.email).toBe(helen.email);
    } finally {
      await deleteUser(helen.userId);
    }
  });

  it("[FAM-12][AC-01] a contact email that differs from the login email is stored, and the login email is unchanged", async () => {
    const helen = await createFamily("contact-email");
    try {
      const cookieStore = new Map<string, string>();
      await cookieClient(cookieStore).auth.signInWithPassword({
        email: helen.email,
        password: PASSWORD,
      });

      await withSession(cookieStore, async () => {
        const { updateFamilyContactDetails } = await import("@/server/profiles/actions");
        return updateFamilyContactDetails({
          name: "Helen Doyle",
          phone: "",
          email: "helen.contact@example.com",
          address: "",
        });
      });

      const { data: profile } = await createAdminClient()
        .from("profiles")
        .select("email, phone, address")
        .eq("id", helen.userId)
        .single();
      expect(profile).toEqual({ email: "helen.contact@example.com", phone: null, address: null });
      const { data: authUser } = await createAdminClient().auth.admin.getUserById(helen.userId);
      expect(authUser.user?.email).toBe(helen.email);
    } finally {
      await deleteUser(helen.userId);
    }
  });

  it("[FAM-12][AC-04] Helen cannot change another profile's row, or her own role", async () => {
    const helen = await createFamily("rls-a");
    const other = await createFamily("rls-b");
    try {
      const cookieStore = new Map<string, string>();
      const client = cookieClient(cookieStore);
      await client.auth.signInWithPassword({ email: helen.email, password: PASSWORD });

      const otherRow = await client
        .from("profiles")
        .update({ phone: "0000 000 000" })
        .eq("id", other.userId)
        .select();
      expect(otherRow.data ?? []).toHaveLength(0);

      const escalate = await client
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", helen.userId)
        .select();
      expect(escalate.error).not.toBeNull();

      const { data: unchanged } = await createAdminClient()
        .from("profiles")
        .select("id, role, phone")
        .in("id", [helen.userId, other.userId]);
      expect(unchanged?.every((row) => row.role === "family")).toBe(true);
      expect(unchanged?.find((row) => row.id === other.userId)?.phone).toBe("0412 345 678");
    } finally {
      await deleteUser(helen.userId);
      await deleteUser(other.userId);
    }
  });

  it("[FAM-12][AC-03] the reset action refuses, and sends nothing, when nobody is signed in", async () => {
    // A real email send is limited to 2 an hour on the local stack, so the address a
    // signed-in user's reset goes to is asserted with a fake client in
    // src/server/profiles/actions.test.ts.
    const signedOut = await withSession(new Map(), async () => {
      const { requestOwnPasswordReset } = await import("@/server/profiles/actions");
      return requestOwnPasswordReset();
    });
    expect(signedOut.ok).toBe(false);
  });
});
