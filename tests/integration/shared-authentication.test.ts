// @vitest-environment node
import { createHmac } from "node:crypto";

import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";
import type { Role } from "@/types/domain";

// Requires a running local Supabase stack (`supabase start`) and `.env.local`
// populated from `supabase status` — see README / F0-04's shared-supabase-environment
// integration test for the same convention. Skips cleanly wherever that isn't set up.
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PASSWORD = "correct horse battery staple 1!";

function uniqueEmail(label: string): string {
  return `f0-07-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

async function createProfile(
  role: Role,
  opts: { organisationId?: string | null; isActive?: boolean } = {},
): Promise<{ userId: string; email: string; password: string }> {
  const admin = createAdminClient();
  const email = uniqueEmail(role);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("failed to create the integration test user");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role,
    organisation_id: opts.organisationId ?? null,
    first_name: "Test",
    last_name: role,
    is_active: opts.isActive ?? true,
  });
  if (profileError) throw profileError;

  return { userId: data.user.id, email, password: PASSWORD };
}

async function deleteUser(userId: string): Promise<void> {
  await createAdminClient().auth.admin.deleteUser(userId);
}

async function createOrganisation(): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organisations")
    .insert({ name: `F0-07 Test Org ${Date.now()}` })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("failed to create the test organisation");
  return data.id;
}

/** A real `@supabase/ssr` client backed by an in-memory cookie jar, standing in for the browser's cookies. */
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

/**
 * Runs `run` with `next/headers` mocked onto `cookieStore`, so the real
 * `src/lib/supabase/server.ts` factory (used inside `src/server/auth/actions.ts`
 * and `queries.ts`) binds to the same session a `cookieClient()` signed in on —
 * same technique as F0-04's shared-supabase-environment integration test.
 */
async function withCookieClient<T>(
  cookieStore: Map<string, string>,
  run: () => Promise<T>,
): Promise<T> {
  const asCookieList = () => [...cookieStore.entries()].map(([name, value]) => ({ name, value }));
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      getAll: asCookieList,
      set: (name: string, value: string) => cookieStore.set(name, value),
    }),
    headers: async () => new Headers({ host: "127.0.0.1:3000", "x-forwarded-proto": "http" }),
  }));
  try {
    return await run();
  } finally {
    vi.doUnmock("next/headers");
  }
}

function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = base32.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const value = alphabet.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** RFC 6238 TOTP, 30s step / 6 digits — matches Supabase Auth's TOTP defaults. */
function totpCode(secret: string, time = Date.now()): string {
  const key = base32Decode(secret);
  const counter = Math.floor(time / 1000 / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac.readUInt8(hmac.length - 1) & 0xf;
  const binCode =
    ((hmac.readUInt8(offset) & 0x7f) << 24) |
    ((hmac.readUInt8(offset + 1) & 0xff) << 16) |
    ((hmac.readUInt8(offset + 2) & 0xff) << 8) |
    (hmac.readUInt8(offset + 3) & 0xff);
  return (binCode % 1_000_000).toString().padStart(6, "0");
}

describe.skipIf(!hasLocalSupabase)("[F0-07] auth", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
  });

  it("[F0-07][AC-02] wrong credentials return a generic error and set no session cookie", async () => {
    const profile = await createProfile("family");
    try {
      const cookieStore = new Map<string, string>();
      const outcome = await withCookieClient(cookieStore, async () => {
        const { signIn } = await import("@/server/auth/actions");
        return signIn({ email: profile.email, password: "definitely-wrong-password" });
      });

      expect(outcome.ok).toBe(false);
      if (!outcome.ok) {
        expect(outcome.error.code).toBe("INVALID_CREDENTIALS");
        expect(outcome.error.message).toBe("That email or password isn't right. Try again.");
      }
      expect(cookieStore.size).toBe(0);
    } finally {
      await deleteUser(profile.userId);
    }
  });

  it("[F0-07][AC-04] a carer requesting the admin guard is redirected to /carer/home", async () => {
    const organisationId = await createOrganisation();
    const profile = await createProfile("carer", { organisationId });
    try {
      const cookieStore = new Map<string, string>();
      const client = cookieClient(cookieStore);
      const { error } = await client.auth.signInWithPassword(profile);
      expect(error).toBeNull();

      const { evaluateRoleGuard } = await import("@/server/auth/guard");
      const outcome = await evaluateRoleGuard(client, "admin");

      expect(outcome).toEqual({ action: "redirect", to: "/carer/home" });
    } finally {
      await deleteUser(profile.userId);
    }
  });

  it("[F0-07][AC-05] no session redirects to /sign-in", async () => {
    const cookieStore = new Map<string, string>();
    const client = cookieClient(cookieStore);

    const { evaluateRoleGuard } = await import("@/server/auth/guard");
    const outcome = await evaluateRoleGuard(client, "family");

    expect(outcome).toEqual({ action: "redirect", to: "/sign-in" });
  });

  it("[F0-07][AC-06] a deactivated profile is signed out and sent to /sign-in?reason=inactive", async () => {
    const organisationId = await createOrganisation();
    const profile = await createProfile("carer", { organisationId, isActive: false });
    try {
      const cookieStore = new Map<string, string>();
      const client = cookieClient(cookieStore);
      const { error } = await client.auth.signInWithPassword(profile);
      expect(error).toBeNull();

      const { evaluateRoleGuard } = await import("@/server/auth/guard");
      const outcome = await evaluateRoleGuard(client, "carer");

      expect(outcome).toEqual({ action: "redirect", to: "/sign-in?reason=inactive" });

      const { data: userAfter } = await client.auth.getUser();
      expect(userAfter.user).toBeNull();
    } finally {
      await deleteUser(profile.userId);
    }
  });

  it("[F0-07][AC-07] a registered email gets the generic reset confirmation", async () => {
    const profile = await createProfile("family");
    try {
      const cookieStore = new Map<string, string>();
      const outcome = await withCookieClient(cookieStore, async () => {
        const { requestPasswordReset } = await import("@/server/auth/actions");
        return requestPasswordReset({ email: profile.email });
      });

      expect(outcome).toEqual({ ok: true, data: undefined });
    } finally {
      await deleteUser(profile.userId);
    }
  });

  it("[F0-07][AC-08] an unregistered email gets the identical generic confirmation (no enumeration)", async () => {
    const cookieStore = new Map<string, string>();
    const outcome = await withCookieClient(cookieStore, async () => {
      const { requestPasswordReset } = await import("@/server/auth/actions");
      return requestPasswordReset({ email: uniqueEmail("unregistered") });
    });

    expect(outcome).toEqual({ ok: true, data: undefined });
  });

  it("[F0-07][AC-09] an admin with no verified TOTP factor is sent to /mfa/enroll", async () => {
    const organisationId = await createOrganisation();
    const profile = await createProfile("admin", { organisationId });
    try {
      const cookieStore = new Map<string, string>();
      const client = cookieClient(cookieStore);
      const { error } = await client.auth.signInWithPassword(profile);
      expect(error).toBeNull();

      const { evaluateRoleGuard } = await import("@/server/auth/guard");
      const outcome = await evaluateRoleGuard(client, "admin");

      expect(outcome).toEqual({ action: "redirect", to: "/mfa/enroll" });
    } finally {
      await deleteUser(profile.userId);
    }
  });

  it("[F0-07][AC-10] an incorrect TOTP code is refused; a correct code reaches AAL2", async () => {
    const organisationId = await createOrganisation();
    const profile = await createProfile("admin", { organisationId });
    try {
      const cookieStore = new Map<string, string>();
      const client = cookieClient(cookieStore);
      const { error: signInError } = await client.auth.signInWithPassword(profile);
      expect(signInError).toBeNull();

      const { data: enrolled, error: enrollError } = await client.auth.mfa.enroll({
        factorType: "totp",
      });
      expect(enrollError).toBeNull();
      if (!enrolled) throw new Error("enroll returned no data");

      // Activate the factor first so this test starts from AC-10's "Given ... a verified TOTP factor".
      const activateChallenge = await client.auth.mfa.challenge({ factorId: enrolled.id });
      expect(activateChallenge.error).toBeNull();
      if (!activateChallenge.data) throw new Error("challenge returned no data");
      const activateVerify = await client.auth.mfa.verify({
        factorId: enrolled.id,
        challengeId: activateChallenge.data.id,
        code: totpCode(enrolled.totp.secret),
      });
      expect(activateVerify.error).toBeNull();

      const wrongOutcome = await withCookieClient(cookieStore, async () => {
        const { verifyMfaCode } = await import("@/server/auth/actions");
        return verifyMfaCode({ factorId: enrolled.id, code: "000000" });
      });
      expect(wrongOutcome.ok).toBe(false);
      if (!wrongOutcome.ok) {
        expect(wrongOutcome.error.code).toBe("MFA_INVALID_CODE");
      }

      const correctOutcome = await withCookieClient(cookieStore, async () => {
        const { verifyMfaCode } = await import("@/server/auth/actions");
        return verifyMfaCode({ factorId: enrolled.id, code: totpCode(enrolled.totp.secret) });
      });
      expect(correctOutcome).toEqual({ ok: true, data: { redirectTo: "/admin/home" } });
    } finally {
      await deleteUser(profile.userId);
    }
  });
});
