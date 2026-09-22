import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import type { CurrentUser } from "@/mocks/current-user";
import type { Role } from "@/types/domain";

import { resolveMfaGatePath, resolveRoleHomePath } from "./routing";

import type { SupabaseClient } from "@supabase/supabase-js";

export type GuardOutcome =
  | { action: "allow"; user: CurrentUser }
  | { action: "redirect"; to: string };

/**
 * Route-group guard (ARCHITECTURE.md §5.2: "Route-group layouts also check
 * role server-side for UX redirects; RLS remains the security boundary").
 * Resolves the signed-in user for `requiredRole`'s dashboard, or says where
 * to redirect instead: no session (AC-05), a deactivated profile (AC-06), a
 * role mismatch (AC-04), or — for an admin profile — an unmet MFA challenge
 * (AC-09/AC-10, OQ-08).
 *
 * Pure of any actual `redirect()` call so it's testable directly; callers
 * (`getCurrentUser`) perform the redirect.
 */
export async function evaluateRoleGuard(
  supabase: SupabaseClient<Database>,
  requiredRole: Role,
): Promise<GuardOutcome> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { action: "redirect", to: "/sign-in" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, organisation_id, first_name, last_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { action: "redirect", to: "/sign-in?reason=inactive" };
  }

  const mfaPath = await resolveMfaGatePath(supabase, profile.role);
  if (mfaPath) {
    return { action: "redirect", to: mfaPath };
  }

  if (profile.role !== requiredRole) {
    return {
      action: "redirect",
      to: await resolveRoleHomePath(supabase, profile.id, profile.role),
    };
  }

  return {
    action: "allow",
    user: {
      profileId: profile.id,
      role: profile.role,
      organisationId: profile.organisation_id ?? "",
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
    },
  };
}
