"use server";

/**
 * `auth` domain Server Actions (F0-07). Unlike other domains' contract
 * functions, these always talk to Supabase Auth directly — there's no
 * meaningful "mock sign-in" (Phase 1 screens pick a role via the `?as=`
 * query param instead, see `src/mocks/current-user.ts`); `DATA_SOURCE` only
 * governs domain *data* reads until their own Phase 3 wiring feature lands.
 * Validated with Zod at the trust boundary (ARCHITECTURE.md §12.4); result
 * shape per ARCHITECTURE.md §4 — never throw to the client for an expected
 * failure. Error copy stays generic for credentials/reset (no account
 * enumeration, PRD.md F0-07 Security).
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/domain";

import { resolveMfaGatePath, resolveRoleHomePath } from "./routing";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "VALIDATION" | "INVALID_CREDENTIALS" | "INACTIVE" | "MFA_INVALID_CODE" | "UNEXPECTED";
        message: string;
      };
    };

const GENERIC_SIGN_IN_ERROR = "That email or password isn't right. Try again.";

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

const SignInInputSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

/** AC-01/AC-02/AC-03: authenticates, then resolves the post-sign-in redirect (home, or an MFA gate). */
export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult<{ redirectTo: string }>> {
  const parsed = SignInInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? "Enter your email and password.",
      },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { ok: false, error: { code: "INVALID_CREDENTIALS", message: GENERIC_SIGN_IN_ERROR } };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, organisation_id, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { ok: false, error: { code: "INACTIVE", message: "Your access has been withdrawn." } };
  }

  const redirectTo = await resolvePostSignInPath(supabase, profile);
  return { ok: true, data: { redirectTo } };
}

async function resolvePostSignInPath(
  supabase: SupabaseClient<Database>,
  profile: { id: string; role: Role; organisation_id: string | null },
): Promise<string> {
  const mfaPath = await resolveMfaGatePath(supabase, profile.role);
  return mfaPath ?? (await resolveRoleHomePath(supabase, profile.id, profile.role));
}

/** Placed in the top bar by F0-15 (PageHeader); ends the session and returns to sign-in. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

const RequestPasswordResetInputSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email address."),
});

/** AC-07/AC-08: identical response for a registered or unregistered email — no account enumeration. */
export async function requestPasswordReset(input: { email: string }): Promise<AuthActionResult> {
  const parsed = RequestPasswordResetInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION", message: "Enter a valid email address." } };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  return { ok: true, data: undefined };
}

const ResetPasswordInputSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/** Sets a new password from the recovery session `auth/confirm` established from the emailed link. */
export async function resetPassword(input: { password: string }): Promise<AuthActionResult> {
  const parsed = ResetPasswordInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? "Enter a new password.",
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNEXPECTED", message: "Your reset link has expired. Request a new one." },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      ok: false,
      error: {
        code: "UNEXPECTED",
        message: "Couldn't update your password. Request a new link and try again.",
      },
    };
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Admin TOTP MFA (OQ-08, CHG-001 — see feature DECISIONS.md)
// ---------------------------------------------------------------------------

/**
 * AC-09: starts TOTP enrollment for the signed-in (admin) user. Clears any
 * stale unverified factor first — `enroll()` only returns the QR/secret
 * once, so a page reload otherwise piles up unusable factors instead of
 * reusing one.
 */
export async function enrollMfaFactor(): Promise<
  AuthActionResult<{ factorId: string; qrCode: string; secret: string }>
> {
  const supabase = await createClient();

  const { data: existingFactors } = await supabase.auth.mfa.listFactors();
  const staleFactors =
    existingFactors?.all.filter(
      (factor) => factor.factor_type === "totp" && factor.status === "unverified",
    ) ?? [];
  for (const factor of staleFactors) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });

  if (error || !data) {
    return {
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't start MFA enrollment. Try again." },
    };
  }

  return {
    ok: true,
    data: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret },
  };
}

const MfaCodeInputSchema = z.object({
  factorId: z.string().min(1),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

/** AC-09/AC-10: verifies a TOTP code, whether completing enrollment or the sign-in-time challenge. */
export async function verifyMfaCode(input: {
  factorId: string;
  code: string;
}): Promise<AuthActionResult<{ redirectTo: string }>> {
  const parsed = MfaCodeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? "Enter the 6-digit code.",
      },
    };
  }

  const supabase = await createClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: parsed.data.factorId,
  });

  if (challengeError || !challenge) {
    return {
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't verify that code. Try again." },
    };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });

  if (verifyError) {
    return {
      ok: false,
      error: {
        code: "MFA_INVALID_CODE",
        message: "That code isn't right. Check your authenticator app and try again.",
      },
    };
  }

  return { ok: true, data: { redirectTo: "/admin/home" } };
}
