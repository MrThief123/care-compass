"use server";

/**
 * `profiles` domain Server Actions (FAM-12). Validated with Zod at the trust
 * boundary (ARCHITECTURE.md §12.4); result shape per ARCHITECTURE.md §4, never
 * throwing to the client for an expected failure. Both actions act on the
 * signed-in user only: neither takes a profile id or an address from the caller.
 * With `DATA_SOURCE=mock` (Phase 1 screens) they validate and succeed without
 * touching a database, so the screen behaves as it did on fixtures.
 */
import { fieldErrors } from "@/components/shared/forms/validation";
import type { FamilyContactDetails } from "@/mocks/queries/profiles";
import { getDataSourceMode } from "@/server/data-source";

import { requestPasswordReset } from "../auth/actions";

import { contactFromRow, contactRowValues, CONTACT_COLUMNS } from "./contact-details";
import { familyInfoSchema, type FamilyInfoValues } from "./contact-schema";

export type ProfileActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "VALIDATION" | "UNEXPECTED";
        message: string;
        /** Per-field messages, keyed by the form's field names. */
        fieldErrors?: Record<string, string>;
      };
    };

const SAVE_FAILED = "Couldn't save your details. Try again.";
const RESET_FAILED = "Couldn't send the reset link. Try again.";
const SIGNED_OUT = "Your session has ended. Sign in again.";

/**
 * AC-01, AC-02: saves the signed-in user's name, phone, contact email and
 * address. Only those columns are written, and only to the user's own row
 * (`profiles_update_self`, 20260925010000_profiles_self_update.sql). The email is
 * the contact email, never the login email (PD-054, OQ-35).
 */
export async function updateFamilyContactDetails(
  input: FamilyInfoValues,
): Promise<ProfileActionResult<FamilyContactDetails>> {
  const parsed = fieldErrors(familyInfoSchema, input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the highlighted fields.",
        fieldErrors: parsed.errors,
      },
    };
  }

  if (getDataSourceMode() === "mock") {
    const { getCurrentUser } = await import("@/mocks/current-user");
    const { profileId } = await getCurrentUser("family");
    return { ok: true, data: { profileId, ...withoutBlanks(parsed.data) } };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: { code: "UNEXPECTED", message: SIGNED_OUT } };

    // `.eq("id", user.id)`: never a caller-supplied id. RLS is the second lock.
    const { data, error } = await supabase
      .from("profiles")
      .update(contactRowValues(parsed.data))
      .eq("id", user.id)
      .select(CONTACT_COLUMNS)
      .maybeSingle();

    // No row back means RLS hid it: not saved, so not a success.
    if (error || !data) return { ok: false, error: { code: "UNEXPECTED", message: SAVE_FAILED } };
    return { ok: true, data: contactFromRow(data) };
  } catch (error) {
    logFailure("updateFamilyContactDetails", error);
    return { ok: false, error: { code: "UNEXPECTED", message: SAVE_FAILED } };
  }
}

/**
 * AC-03: emails the signed-in user a password reset link, at their login
 * address (from the session, never from the caller), through F0-07's
 * `requestPasswordReset`.
 */
export async function requestOwnPasswordReset(): Promise<ProfileActionResult> {
  if (getDataSourceMode() === "mock") return { ok: true, data: undefined };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false, error: { code: "UNEXPECTED", message: SIGNED_OUT } };

    const result = await requestPasswordReset({ email: user.email });
    if (!result.ok) return { ok: false, error: { code: "UNEXPECTED", message: RESET_FAILED } };
    return { ok: true, data: undefined };
  } catch (error) {
    logFailure("requestOwnPasswordReset", error);
    return { ok: false, error: { code: "UNEXPECTED", message: RESET_FAILED } };
  }
}

/** A blank phone, email or address is left out, as the contract does (CHG-023). */
function withoutBlanks(values: FamilyInfoValues): Omit<FamilyContactDetails, "profileId"> {
  const { name, phone, email, address } = values;
  return { name, ...(phone && { phone }), ...(email && { email }), ...(address && { address }) };
}

/** A feature tag and the error's class only: the message may carry client data (ARCHITECTURE.md §12.5). */
function logFailure(action: string, error: unknown) {
  console.error(`[profiles] ${action} failed:`, error instanceof Error ? error.name : "unknown");
}
