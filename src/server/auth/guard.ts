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
  const resolved = await resolveActiveProfile(supabase);
  if ("redirect" in resolved) {
    return { action: "redirect", to: resolved.redirect };
  }
  const { profile } = resolved;

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

/**
 * Where `/` sends a visitor (F0-19): sign-in when signed out, otherwise the
 * same MFA gate and role home the route-group guard uses.
 */
export async function evaluateLanding(supabase: SupabaseClient<Database>): Promise<string> {
  const resolved = await resolveActiveProfile(supabase);
  if ("redirect" in resolved) return resolved.redirect;

  const { profile } = resolved;
  return resolveRoleHomePath(supabase, profile.id, profile.role);
}

/**
 * Shared first steps of both guards: a session (AC-05), an active profile
 * (AC-06), and — for an admin — a met MFA challenge (AC-09/AC-10, OQ-08).
 */
type ActiveProfileOutcome =
  | { redirect: string }
  | {
      profile: Pick<
        Database["public"]["Tables"]["profiles"]["Row"],
        "id" | "role" | "organisation_id" | "first_name" | "last_name" | "is_active"
      >;
    };

async function resolveActiveProfile(
  supabase: SupabaseClient<Database>,
): Promise<ActiveProfileOutcome> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirect: "/sign-in" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, organisation_id, first_name, last_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { redirect: "/sign-in?reason=inactive" };
  }

  const mfaPath = await resolveMfaGatePath(supabase, profile.role);
  if (mfaPath) {
    return { redirect: mfaPath };
  }

  return { profile };
}
