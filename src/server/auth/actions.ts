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

import { discardUnregisteredAccount, registerAccount } from "./registration";
import { resolveMfaGatePath, resolveRoleHomePath } from "./routing";
import { SignUpInputSchema } from "./sign-up-schema";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code:
          | "VALIDATION"
          | "INVALID_CREDENTIALS"
          | "INACTIVE"
          | "MFA_INVALID_CODE"
          | "MFA_FACTOR_MISSING"
          | "EMAIL_EXISTS"
          | "REGISTRATION_FAILED"
          | "UNEXPECTED";
        message: string;
        /** Per-field messages, keyed by the form's field names (F0-17, FD-05). */
        fieldErrors?: Record<string, string>;
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

// ---------------------------------------------------------------------------
// Sign up (F0-17)
// ---------------------------------------------------------------------------

const EMAIL_EXISTS_MESSAGE =
  "An account with this email already exists. Sign in or reset your password.";
const REGISTRATION_FAILED_MESSAGE = "We couldn't create your account. Please try again.";

/**
 * AC-01 to AC-04, AC-06: creates the auth user, then the account's records in one database
 * transaction (`register_account`), then signs the person in and resolves the same redirect
 * `signIn` would. `input` is untrusted: it is parsed with the shared schema, which strips
 * any organisation or client id, and the database function has no such parameters either.
 * If the records cannot be created the half-made auth user is discarded (FD-01).
 */
export async function signUp(input: unknown): Promise<AuthActionResult<{ redirectTo: string }>> {
  const parsed = SignUpInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join(".");
      if (key && fieldErrors[key] === undefined) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? "Check the highlighted fields.",
        fieldErrors,
      },
    };
  }
  const values = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
  });

  if (error) {
    if (error.code === "user_already_exists" || /already (been )?registered/i.test(error.message)) {
      return { ok: false, error: { code: "EMAIL_EXISTS", message: EMAIL_EXISTS_MESSAGE } };
    }
    if (error.code === "weak_password") {
      return {
        ok: false,
        error: {
          code: "VALIDATION",
          message: error.message,
          fieldErrors: { password: error.message },
        },
      };
    }
    return { ok: false, error: { code: "UNEXPECTED", message: REGISTRATION_FAILED_MESSAGE } };
  }

  // With email confirmation off (PD-057) a new user comes back signed in. An empty identities
  // list is Supabase's way of saying the email is already taken when confirmation is on.
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, error: { code: "EMAIL_EXISTS", message: EMAIL_EXISTS_MESSAGE } };
  }
  if (!data.user || !data.session) {
    return {
      ok: false,
      error: { code: "REGISTRATION_FAILED", message: REGISTRATION_FAILED_MESSAGE },
    };
  }

  const registered = await registerAccount(supabase, values);
  if (registered.error) {
    await discardUnregisteredAccount(supabase);
    await supabase.auth.signOut();
    return {
      ok: false,
      error: { code: "REGISTRATION_FAILED", message: REGISTRATION_FAILED_MESSAGE },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, organisation_id")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) {
    return {
      ok: false,
      error: { code: "REGISTRATION_FAILED", message: REGISTRATION_FAILED_MESSAGE },
    };
  }

  const redirectTo = await resolvePostSignInPath(supabase, profile);
  return { ok: true, data: { redirectTo } };
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

type PasswordUpdate =
  | { ok: true; userId: string; supabase: SupabaseClient<Database> }
  | { ok: false; error: Extract<AuthActionResult, { ok: false }>["error"] };

/**
 * Sets the password of the session `/auth/confirm` established from an emailed link. Shared by
 * `resetPassword` and `setPassword`; no session (link expired, used, or never opened) is the same
 * "request a new one" answer for both.
 */
async function updateOwnPassword(
  input: { password: string },
  noSession: string,
): Promise<PasswordUpdate> {
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
    return { ok: false, error: { code: "UNEXPECTED", message: noSession } };
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

  return { ok: true, userId: user.id, supabase };
}

/** Sets a new password from the recovery session `auth/confirm` established from the emailed link. */
export async function resetPassword(input: { password: string }): Promise<AuthActionResult> {
  const result = await updateOwnPassword(input, "Your reset link has expired. Request a new one.");
  return result.ok ? { ok: true, data: undefined } : result;
}

/**
 * F0-24 AC-03: an invited carer sets their first password from the invite session, is already
 * signed in by it, and goes to the role home (or an MFA gate), exactly as `signIn` would send them.
 */
export async function setPassword(input: {
  password: string;
}): Promise<AuthActionResult<{ redirectTo: string }>> {
  const result = await updateOwnPassword(
    input,
    "Your invite link has expired. Ask your administrator to send a new invite.",
  );
  if (!result.ok) return result;

  const { data: profile } = await result.supabase
    .from("profiles")
    .select("id, role, organisation_id, is_active")
    .eq("id", result.userId)
    .maybeSingle();
  if (!profile || !profile.is_active) {
    await result.supabase.auth.signOut();
    return { ok: false, error: { code: "INACTIVE", message: "Your access has been withdrawn." } };
  }

  return { ok: true, data: { redirectTo: await resolvePostSignInPath(result.supabase, profile) } };
}

// ---------------------------------------------------------------------------
// Admin TOTP MFA (OQ-08, CHG-001 — see feature DECISIONS.md)
// ---------------------------------------------------------------------------

/**
 * An unverified factor younger than this may belong to a page the admin still has open, so
 * clean-up leaves it alone (F0-20 AC-03).
 */
const STALE_FACTOR_AGE_MS = 5 * 60_000;

/**
 * F0-20 AC-02/AC-03: starts TOTP enrolment. Called once from the browser (AC-04), never from a
 * server render. Every factor gets a unique friendly name, so two enrolments at the same time
 * cannot collide (422 `mfa_factor_name_conflict`), and only unverified factors older than
 * STALE_FACTOR_AGE_MS are cleaned up, so one enrolment can never delete the factor another
 * page is showing. Clean-up is best effort: its failure never fails the enrolment.
 */
export async function enrollMfaFactor(): Promise<
  AuthActionResult<{ factorId: string; qrCode: string; secret: string }>
> {
  const supabase = await createClient();

  try {
    const { data: existingFactors } = await supabase.auth.mfa.listFactors();
    const cutoff = Date.now() - STALE_FACTOR_AGE_MS;
    const staleFactors =
      existingFactors?.all.filter(
        (factor) =>
          factor.factor_type === "totp" &&
          factor.status === "unverified" &&
          new Date(factor.created_at).getTime() < cutoff,
      ) ?? [];
    for (const factor of staleFactors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  } catch {
    // Best effort: a leftover unverified factor is harmless; the next enrolment retries.
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `admin-totp-${crypto.randomUUID()}`,
  });

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

  if (challengeError?.code === "mfa_factor_not_found") {
    return {
      ok: false,
      error: {
        code: "MFA_FACTOR_MISSING",
        message: "This setup has expired. Reload the page to start again.",
      },
    };
  }

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
