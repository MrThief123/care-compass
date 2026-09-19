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

      if (!carer) {
        throw new Error("src/mocks/fixtures CARER_PROFILES is unexpectedly empty.");
      }

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

      if (!family) {
        throw new Error("src/mocks/fixtures FAMILY_PROFILES is unexpectedly empty.");
      }

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
 * Returns the mock signed-in user.
 */
export async function getCurrentUser(role: Role = DEFAULT_ROLE): Promise<CurrentUser> {
  return profileForRole(role);
}
