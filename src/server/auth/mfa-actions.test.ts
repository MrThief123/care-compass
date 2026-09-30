// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeMfaSupabase } from "../../../tests/helpers/fake-mfa-supabase";

let fake = createFakeMfaSupabase();
let signInResult: { data: unknown; error: unknown } = { data: null, error: { message: "bad" } };

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      ...fake.auth,
      signInWithPassword: async () => signInResult,
      signUp: async () => ({
        data: { user: null, session: null },
        error: { code: "weak_password", message: "Password is too weak" },
      }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: "u1", role: "admin", organisation_id: "o1", is_active: true },
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "127.0.0.1:3000" }),
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("./routing", () => ({
  resolveMfaGatePath: async () => "/mfa/enroll",
  resolveRoleHomePath: async () => "/admin/home",
}));

import { enrollMfaFactor, signIn, signUp, verifyMfaCode } from "./actions";

const OLD = new Date(Date.now() - 10 * 60_000).toISOString();

beforeEach(() => {
  fake = createFakeMfaSupabase();
  signInResult = { data: null, error: { message: "bad" } };
});
afterEach(() => vi.restoreAllMocks());

describe("[F0-20] enrolMfaFactor", () => {
  it("[F0-20][AC-02] two enrolments at the same time both succeed with different factor names", async () => {
    const [a, b] = await Promise.all([enrollMfaFactor(), enrollMfaFactor()]);

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    const names = fake.factors.map((factor) => factor.friendly_name);
    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(2);
    expect(names.every((name) => /^admin-totp-.+/.test(name ?? ""))).toBe(true);
  });

  it("[F0-20][AC-02] five enrolments at the same time never surface an error", async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => enrollMfaFactor()));

    expect(results.every((result) => result.ok)).toBe(true);
  });

  it("[F0-20][AC-03] removes an old unverified factor but keeps a fresh one and a verified one", async () => {
    fake.seed({ id: "old-unverified", friendly_name: "a", created_at: OLD });
    fake.seed({ id: "fresh-unverified", friendly_name: "b" });
    fake.seed({ id: "old-verified", friendly_name: "c", status: "verified", created_at: OLD });

    const result = await enrollMfaFactor();

    expect(result.ok).toBe(true);
    const ids = fake.factors.map((factor) => factor.id);
    expect(ids).not.toContain("old-unverified");
    expect(ids).toContain("fresh-unverified");
    expect(ids).toContain("old-verified");
  });

  it("[F0-20][AC-03] a failed clean-up of an old factor does not fail the enrolment", async () => {
    fake.seed({ id: "old-unverified", friendly_name: "a", created_at: OLD });
    vi.spyOn(fake.auth.mfa, "unenroll").mockResolvedValue({
      data: null,
      error: {
        name: "AuthApiError",
        message: "Factor not found",
        status: 404,
        code: "mfa_factor_not_found",
      },
    });

    const result = await enrollMfaFactor();

    expect(result.ok).toBe(true);
  });

  it("[F0-20][AC-02] an enrolment Supabase refuses returns a message, not a throw", async () => {
    vi.spyOn(fake.auth.mfa, "enroll").mockResolvedValue({
      data: null,
      error: { name: "AuthApiError", message: "boom", status: 500, code: "unexpected_failure" },
    });

    const result = await enrollMfaFactor();

    expect(result).toEqual({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't start MFA enrollment. Try again." },
    });
  });
});

describe("[F0-20] verifyMfaCode", () => {
  async function enrolled() {
    const result = await enrollMfaFactor();
    if (!result.ok) throw new Error("enrol failed");
    return result.data.factorId;
  }

  it("[F0-20][AC-06] a code that is not six digits is a validation message", async () => {
    const factorId = await enrolled();

    for (const code of ["", "12345", "1234567", "abcdef", "881452881452"]) {
      const result = await verifyMfaCode({ factorId, code });
      expect(result).toEqual({
        ok: false,
        error: { code: "VALIDATION", message: "Enter the 6-digit code." },
      });
    }
  });

  it("[F0-20][AC-06] a wrong code is refused with the 'isn't right' message", async () => {
    const factorId = await enrolled();

    const result = await verifyMfaCode({ factorId, code: "000000" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "MFA_INVALID_CODE",
        message: "That code isn't right. Check your authenticator app and try again.",
      },
    });
  });

  it("[F0-20][AC-06] a code from the previous window is refused like a wrong code", async () => {
    const factorId = await enrolled();
    fake.setValidCode("222222"); // the window moved on; "123456" has expired

    const result = await verifyMfaCode({ factorId, code: "123456" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MFA_INVALID_CODE");
  });

  it("[F0-20][AC-06] the right code succeeds and activates the factor", async () => {
    const factorId = await enrolled();

    const result = await verifyMfaCode({ factorId, code: "123456" });

    expect(result).toEqual({ ok: true, data: { redirectTo: "/admin/home" } });
    expect(fake.factors.find((factor) => factor.id === factorId)?.status).toBe("verified");
  });

  it("[F0-20][AC-06] a factor that no longer exists gets a clear 'reload' message", async () => {
    const result = await verifyMfaCode({ factorId: "gone", code: "123456" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "MFA_FACTOR_MISSING",
        message: "This setup has expired. Reload the page to start again.",
      },
    });
  });

  it("[F0-20][AC-06] an unexpected Supabase failure returns a message and never throws", async () => {
    vi.spyOn(fake.auth.mfa, "challenge").mockResolvedValue({
      data: null,
      error: { name: "AuthApiError", message: "down", status: 500, code: "unexpected_failure" },
    });

    const result = await verifyMfaCode({ factorId: "f", code: "123456" });

    expect(result).toEqual({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't verify that code. Try again." },
    });
  });
});

describe("[F0-20] no credentials in our logs", () => {
  const SECRET_VALUES = ["hunter2-password!", "admin@example.test", "JBSWY3DPEHPK3PXP", "123456"];

  function spyOnLogs() {
    return (["log", "info", "warn", "error", "debug"] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {}),
    );
  }

  it("[F0-20][AC-09] sign-in, sign-up and MFA actions log no email, password, code or secret", async () => {
    const spies = spyOnLogs();
    const stdout = vi.spyOn(process.stdout, "write");
    const stderr = vi.spyOn(process.stderr, "write");

    // sign-in: failure, then success
    await signIn({ email: "admin@example.test", password: "hunter2-password!" });
    signInResult = { data: { user: { id: "u1" } }, error: null };
    await signIn({ email: "admin@example.test", password: "hunter2-password!" });
    // sign-up: a Supabase failure
    await signUp({
      accountType: "organisation",
      firstName: "Test",
      lastName: "Admin",
      organisationName: "Test Org",
      email: "admin@example.test",
      password: "hunter2-password!",
      confirmPassword: "hunter2-password!",
    });
    // MFA: enrol, wrong code, right code
    const enrolled = await enrollMfaFactor();
    if (!enrolled.ok) throw new Error("enrol failed");
    await verifyMfaCode({ factorId: enrolled.data.factorId, code: "000000" });
    await verifyMfaCode({ factorId: enrolled.data.factorId, code: "123456" });

    const written = [
      ...spies.flatMap((spy) => spy.mock.calls),
      ...stdout.mock.calls,
      ...stderr.mock.calls,
    ]
      .flat()
      .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
      .join("\n");
    for (const secret of SECRET_VALUES) {
      expect(written).not.toContain(secret);
    }
  });
});
