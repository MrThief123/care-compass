// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`) and `.env.local`
// populated from `supabase status` (see README). Skips cleanly wherever
// that isn't set up — CI doesn't run this until F0-06 wires a Supabase
// service into the pipeline (see F0-03's db-test job placeholder).
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

describe.skipIf(!hasLocalSupabase)("[F0-04][AC-03] Supabase server client", () => {
  const email = `f0-04-integration-${Date.now()}@example.test`;
  const password = "correct horse battery staple 1!";
  let userId: string;

  beforeAll(async () => {
    const { data, error } = await createAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw error ?? new Error("failed to create the integration test user");
    }
    userId = data.user.id;
  });

  afterAll(async () => {
    if (userId) {
      await createAdminClient().auth.admin.deleteUser(userId);
    }
  });

  it("resolves the signed-in user's own identity from their session cookie, not an admin/anon session", async () => {
    // An in-memory cookie jar standing in for the browser's cookies across
    // two separate Supabase clients — one signing in, one (the factory
    // under test) reading the resulting session back.
    const cookieStore = new Map<string, string>();
    const asCookieList = () => [...cookieStore.entries()].map(([name, value]) => ({ name, value }));

    const signInClient = createServerClient(
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

    const { error: signInError } = await signInClient.auth.signInWithPassword({ email, password });
    expect(signInError).toBeNull();
    expect(cookieStore.size).toBeGreaterThan(0);

    // Exercise the actual src/lib/supabase/server.ts factory, backed by the
    // same cookie jar via a mocked next/headers.
    vi.resetModules();
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        getAll: asCookieList,
        set: (name: string, value: string) => cookieStore.set(name, value),
      }),
    }));

    const { createClient } = await import("@/lib/supabase/server");
    const serverClient = await createClient();

    const { data: userData, error: userError } = await serverClient.auth.getUser();

    expect(userError).toBeNull();
    expect(userData.user?.id).toBe(userId);

    vi.doUnmock("next/headers");
  });
});
