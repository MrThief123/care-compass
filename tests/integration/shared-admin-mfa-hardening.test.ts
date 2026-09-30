// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";
import type { Role } from "@/types/domain";

import { freshTotpCode, totpCode } from "../helpers/totp";

// F0-20. Writes users to the database it points at, so it only runs against a LOCAL Supabase stack:
//   eval "$(supabase status -o env | sed 's/^/export /')"  # or set the three variables by hand
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   SUPABASE_SERVICE_ROLE_KEY=... npx vitest run tests/integration/shared-admin-mfa-hardening.test.ts
// `.env.local` is the hosted project, so a run without the overrides skips.
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocal &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const TIMEOUT = 60_000;

function uniqueEmail(label: string): string {
  return `f0-20-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

async function createOrganisation(): Promise<string> {
  const { data, error } = await createAdminClient()
    .from("organisations")
    .insert({ name: `F0-20 Test Org ${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("failed to create the test organisation");
  return data.id;
}

async function createProfile(role: Role, organisationId: string | null = null) {
  const admin = createAdminClient();
  const email = uniqueEmail(role);
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
    first_name: "Test",
    last_name: role,
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email, password: PASSWORD };
}

async function deleteUser(userId: string) {
  await createAdminClient().auth.admin.deleteUser(userId);
}

/** A real `@supabase/ssr` client on an in-memory cookie jar: the browser's cookies. */
function cookieClient(jar: Map<string, string>) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
        setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
      },
    },
  );
}

/** Runs `run` with `next/headers` bound to `jar`, so the real server client shares that session. */
async function withJar<T>(jar: Map<string, string>, run: () => Promise<T>): Promise<T> {
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => jar.set(name, value),
    }),
    headers: async () => new Headers({ host: "127.0.0.1:3100", "x-forwarded-proto": "http" }),
  }));
  try {
    return await run();
  } finally {
    vi.doUnmock("next/headers");
  }
}

async function actions() {
  return import("@/server/auth/actions");
}

describe.skipIf(!hasLocalSupabase)("[F0-20] admin TOTP MFA against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
  });

  it(
    "[F0-20][AC-02] two enrolments at the same time both succeed with different secrets",
    async () => {
      const profile = await createProfile("admin", await createOrganisation());
      try {
        const jar = new Map<string, string>();
        const { error } = await cookieClient(jar).auth.signInWithPassword(profile);
        expect(error).toBeNull();

        const [a, b] = await withJar(jar, async () => {
          const { enrollMfaFactor } = await actions();
          return Promise.all([enrollMfaFactor(), enrollMfaFactor()]);
        });

        expect(a.ok).toBe(true);
        expect(b.ok).toBe(true);
        if (a.ok && b.ok) {
          expect(a.data.factorId).not.toBe(b.data.factorId);
          expect(a.data.secret).not.toBe(b.data.secret);
        }
      } finally {
        await deleteUser(profile.userId);
      }
    },
    TIMEOUT,
  );

  it(
    "[F0-20][AC-06] a real TOTP: wrong code refused, right code activates, a deleted factor gives the reload message",
    async () => {
      const profile = await createProfile("admin", await createOrganisation());
      try {
        const jar = new Map<string, string>();
        await cookieClient(jar).auth.signInWithPassword(profile);

        const enrolled = await withJar(jar, async () => (await actions()).enrollMfaFactor());
        if (!enrolled.ok) throw new Error("enrol failed");
        const { factorId, secret, qrCode } = enrolled.data;
        expect(qrCode.startsWith("data:") || qrCode.startsWith("<svg")).toBe(true);

        const wrong = await withJar(jar, async () =>
          (await actions()).verifyMfaCode({ factorId, code: "000000" }),
        );
        expect(wrong.ok).toBe(false);
        if (!wrong.ok) expect(wrong.error.code).toBe("MFA_INVALID_CODE");

        const right = await withJar(jar, async () =>
          (await actions()).verifyMfaCode({ factorId, code: totpCode(secret) }),
        );
        expect(right).toEqual({ ok: true, data: { redirectTo: "/admin/home" } });

        await createAdminClient().auth.admin.mfa.deleteFactor({
          userId: profile.userId,
          id: factorId,
        });
        const gone = await withJar(jar, async () =>
          (await actions()).verifyMfaCode({ factorId, code: totpCode(secret) }),
        );
        expect(gone.ok).toBe(false);
        if (!gone.ok) expect(gone.error.code).toBe("MFA_FACTOR_MISSING");
      } finally {
        await deleteUser(profile.userId);
      }
    },
    TIMEOUT,
  );

  it(
    "[F0-20][AC-07] sign in, enrol, verify, sign out, sign in, verify, reach the admin home",
    async () => {
      const profile = await createProfile("admin", await createOrganisation());
      try {
        // first session: no factor yet
        const jar1 = new Map<string, string>();
        const first = await withJar(jar1, async () => (await actions()).signIn(profile));
        expect(first).toEqual({ ok: true, data: { redirectTo: "/mfa/enroll" } });

        const enrolled = await withJar(jar1, async () => (await actions()).enrollMfaFactor());
        if (!enrolled.ok) throw new Error("enrol failed");
        const enrolCode = totpCode(enrolled.data.secret);
        const activated = await withJar(jar1, async () =>
          (await actions()).verifyMfaCode({ factorId: enrolled.data.factorId, code: enrolCode }),
        );
        expect(activated).toEqual({ ok: true, data: { redirectTo: "/admin/home" } });

        const atHome = await withJar(jar1, async () => {
          const { evaluateRoleGuard } = await import("@/server/auth/guard");
          return evaluateRoleGuard(cookieClient(jar1), "admin");
        });
        expect(atHome.action).toBe("allow");

        // "sign out": a brand new browser session
        await cookieClient(jar1).auth.signOut();
        const jar2 = new Map<string, string>();
        const second = await withJar(jar2, async () => (await actions()).signIn(profile));
        expect(second).toEqual({ ok: true, data: { redirectTo: "/mfa/verify" } });

        const factorId = await withJar(jar2, async () => {
          const { getPrimaryTotpFactorId } = await import("@/server/auth/queries");
          return getPrimaryTotpFactorId();
        });
        expect(factorId).toBe(enrolled.data.factorId);

        const code = await freshTotpCode(enrolled.data.secret, enrolCode);
        const verified = await withJar(jar2, async () =>
          (await actions()).verifyMfaCode({ factorId: factorId!, code }),
        );
        expect(verified).toEqual({ ok: true, data: { redirectTo: "/admin/home" } });
      } finally {
        await deleteUser(profile.userId);
      }
    },
    TIMEOUT,
  );

  it(
    "[F0-20][AC-08] an AAL1 admin session is sent to /mfa/verify; unenrolling sends the admin back to /mfa/enroll",
    async () => {
      const profile = await createProfile("admin", await createOrganisation());
      try {
        const jar1 = new Map<string, string>();
        await cookieClient(jar1).auth.signInWithPassword(profile);
        const enrolled = await withJar(jar1, async () => (await actions()).enrollMfaFactor());
        if (!enrolled.ok) throw new Error("enrol failed");
        await withJar(jar1, async () =>
          (await actions()).verifyMfaCode({
            factorId: enrolled.data.factorId,
            code: totpCode(enrolled.data.secret),
          }),
        );

        // password only, no code: AAL1
        const aal1 = new Map<string, string>();
        const client = cookieClient(aal1);
        await client.auth.signInWithPassword(profile);
        const { evaluateRoleGuard } = await import("@/server/auth/guard");
        expect(await evaluateRoleGuard(client, "admin")).toEqual({
          action: "redirect",
          to: "/mfa/verify",
        });

        // unenroll from the AAL2 session; the next sign-in must enrol again
        const { error } = await cookieClient(jar1).auth.mfa.unenroll({
          factorId: enrolled.data.factorId,
        });
        expect(error).toBeNull();
        const again = new Map<string, string>();
        const againClient = cookieClient(again);
        await againClient.auth.signInWithPassword(profile);
        expect(await evaluateRoleGuard(againClient, "admin")).toEqual({
          action: "redirect",
          to: "/mfa/enroll",
        });
      } finally {
        await deleteUser(profile.userId);
      }
    },
    TIMEOUT,
  );

  it(
    "[F0-20][AC-08] family and carer are never sent to an MFA route",
    async () => {
      const family = await createProfile("family");
      const carer = await createProfile("carer", await createOrganisation());
      try {
        for (const profile of [family, carer]) {
          const jar = new Map<string, string>();
          const outcome = await withJar(jar, async () => (await actions()).signIn(profile));
          expect(outcome.ok).toBe(true);
          if (outcome.ok) expect(outcome.data.redirectTo).not.toMatch(/^\/mfa\//);
        }
      } finally {
        await deleteUser(family.userId);
        await deleteUser(carer.userId);
      }
    },
    TIMEOUT,
  );
});
