import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import type { Role } from "@/types/domain";

import type { SupabaseClient } from "@supabase/supabase-js";

/** PRD.md F0-07 Error/Edge Cases: family account with no linked client yet. */
export const NO_CLIENT_LINKED_PATH = "/no-client-linked";

type Supabase = SupabaseClient<Database>;

/**
 * Where a profile's own dashboard home is. Family has no single home route —
 * it's scoped to their first linked client (PRD.md F0-07 Scope: "family →
 * `/family/[clientId]/home` (first linked client)"); multi-client switching
 * is parked (OQ-30).
 */
export async function resolveRoleHomePath(
  supabase: Supabase,
  profileId: string,
  role: Role,
): Promise<string> {
  if (role === "admin") return "/admin/home";
  if (role === "carer") return "/carer/home";

  const { data } = await supabase
    .from("client_family_members")
    .select("client_id")
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();

  return data ? `/family/${data.client_id}/home` : NO_CLIENT_LINKED_PATH;
}

/**
 * Admin accounts must reach AAL2 via TOTP before any admin route (OQ-08:
 * MFA required for admins). Returns the MFA route to send them to, or null
 * when no gate applies (not an admin, or already at AAL2).
 */
export async function resolveMfaGatePath(supabase: Supabase, role: Role): Promise<string | null> {
  if (role !== "admin") return null;

  // `listFactors()`'s `totp` convenience array is already verified-only. With
  // zero factors enrolled, AAL never differs (there's nothing to step up to)
  // — so a missing factor must be checked before the AAL comparison below.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedTotp = (factors?.totp.length ?? 0) > 0;
  if (!hasVerifiedTotp) return "/mfa/enroll";

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.currentLevel !== aal.nextLevel) return "/mfa/verify";

  return null;
}
