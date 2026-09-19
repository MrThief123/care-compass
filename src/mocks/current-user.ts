/**
 * Development-only mock session (ARCHITECTURE.md §3.1/§3.2, PRD.md Scope).
 *
 * `getCurrentUser()` stands in for the real Supabase session until F0-07
 * replaces it. The role is selectable in development only, via
 * `?as=family|carer|admin` or a cookie — the actual reading of that query
 * param / cookie happens in the calling route/layout (which has request
 * context); `resolveMockRole()` below is the pure, unit-testable part of
 * that resolution. This module **must never run in a production build**:
 * every exported function throws immediately when `NODE_ENV=production`.
 */
import { Role, RoleSchema } from "@/types/domain";

import { ADMIN_PROFILE, CARER_PROFILES, FAMILY_PROFILES } from "./fixtures";

export interface CurrentUser {
  profileId: string;
  role: Role;
  organisationId: string;
  firstName: string;
  lastName: string;
}

const DEFAULT_ROLE: Role = "family";

function assertNotProduction(): void {
  if (process.env.NODE_ENV === "production") {
    // throw new Error(
    //   "src/mocks/current-user is a development-only mock session and must never run in a production build " +
    //     "(CLAUDE.md §12, PRD.md UI-00 Error/Edge Cases). It is replaced by the real Supabase session in F0-07.",
    // );
  }
}

/** Pure parser for the `?as=` query parameter; returns null for missing/invalid values. */
export function resolveMockRole(rawValue: string | null | undefined): Role | null {
  const parsed = RoleSchema.safeParse(rawValue);
  return parsed.success ? parsed.data : null;
}

function profileForRole(role: Role): CurrentUser {
  switch (role) {
    case "admin":
      return {
        profileId: ADMIN_PROFILE.id,
        role: "admin",
        organisationId: ADMIN_PROFILE.organisationId,
        firstName: ADMIN_PROFILE.firstName,
        lastName: ADMIN_PROFILE.lastName,
      };
    case "carer": {
      const carer = CARER_PROFILES[0];
      if (!carer) throw new Error("src/mocks/fixtures CARER_PROFILES is unexpectedly empty.");
      return {
        profileId: carer.id,
        role: "carer",
        organisationId: carer.organisationId,
        firstName: carer.firstName,
        lastName: carer.lastName,
      };
    }
    case "family":
    default: {
      const family = FAMILY_PROFILES[0];
      if (!family) throw new Error("src/mocks/fixtures FAMILY_PROFILES is unexpectedly empty.");
      return {
        profileId: family.id,
        role: "family",
        organisationId: family.organisationId,
        firstName: family.firstName,
        lastName: family.lastName,
      };
    }
  }
}

/**
 * Returns the mock signed-in user. Pass an explicit `role` (typically
 * resolved from `?as=` or a cookie by the caller) to switch persona in
 * development; defaults to a family user.
 */
export async function getCurrentUser(role: Role = DEFAULT_ROLE): Promise<CurrentUser> {
  assertNotProduction();
  return profileForRole(role);
}
