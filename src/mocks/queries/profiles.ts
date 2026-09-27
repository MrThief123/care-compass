/**
 * Mock (fixture-backed) implementation of the `profiles` domain contract
 * (CHG-023). Read only by `src/server/profiles/queries.ts` — never imported
 * directly by `src/app` or `src/features`.
 */
import { CARER_PROFILES, FAMILY_PROFILES } from "@/mocks/fixtures";

export interface FamilyContactDetails {
  profileId: string;
  /** Full name, first and last (PD-038). */
  name: string;
  phone?: string;
  /** The contact email (`profiles.email`), never the login email (PD-054). */
  email?: string;
  address?: string;
}

/** A new object each call, so a caller that edits it cannot change the fixtures. */
export async function getFamilyContactDetails(profileId: string): Promise<FamilyContactDetails> {
  const profile = FAMILY_PROFILES.find((candidate) => candidate.id === profileId);
  if (!profile) {
    throw new Error(`getFamilyContactDetails: no family profile found for id "${profileId}".`);
  }

  const { firstName, lastName, phone, email, address } = profile;
  return {
    profileId: profile.id,
    name: `${firstName} ${lastName}`,
    // A missing value is left out, not an empty string (CHG-023).
    ...(phone && { phone }),
    ...(email && { email }),
    ...(address && { address }),
  };
}

export interface CarerContactDetails {
  profileId: string;
  /** Full name, first and last (PD-038). */
  name: string;
  phone?: string;
  /** The contact email (`profiles.email`), never the login email (PD-054). */
  email?: string;
  /** The carer's job title (CAR-UI-04 FD-02). */
  role?: string;
}

/** A new object each call, so a caller that edits it cannot change the fixtures. */
export async function getCarerContactDetails(profileId: string): Promise<CarerContactDetails> {
  const profile = CARER_PROFILES.find((candidate) => candidate.id === profileId);
  if (!profile) {
    throw new Error(`getCarerContactDetails: no carer profile found for id "${profileId}".`);
  }

  const { firstName, lastName, phone, email, jobTitle } = profile;
  return {
    profileId: profile.id,
    name: `${firstName} ${lastName}`,
    // A missing value is left out, not an empty string (CHG-023).
    ...(phone && { phone }),
    ...(email && { email }),
    ...(jobTitle && { role: jobTitle }),
  };
}
