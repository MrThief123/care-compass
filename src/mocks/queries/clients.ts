/**
 * Mock (fixture-backed) implementation of the `clients` domain contract.
 * Read only by `src/server/clients/queries.ts` — never imported directly
 * by `src/app` or `src/features`.
 */
import { ageFromDob } from "@/lib/format/age";
import { CLIENT_INFO_SECTIONS, CLIENTS, ORGANISATION, REFERENCE_DATE } from "@/mocks/fixtures";
import type { ClientInfoSection, ClientInfoSectionKind } from "@/types/domain";

export interface ClientHeaderSummary {
  id: string;
  firstName: string;
  lastName: string;
  /** Whole years, computed from dob as of "now" (Australia/Melbourne). */
  age: number;
  suburb?: string;
  /** Omitted for a client with no current organisation (PRD Error/Edge Cases). */
  organisationName?: string;
}

export async function getClientHeaderSummary(clientId: string): Promise<ClientHeaderSummary> {
  const client = CLIENTS.find((candidate) => candidate.id === clientId);
  if (!client) {
    throw new Error(`getClientHeaderSummary: no client found for id "${clientId}".`);
  }

  return {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    age: ageFromDob(client.dob, REFERENCE_DATE),
    suburb: client.suburb,
    organisationName: client.organisationId === ORGANISATION.id ? ORGANISATION.name : undefined,
  };
}

/** The order the sections are drawn in on Family · Info. */
const SECTION_ORDER: readonly ClientInfoSectionKind[] = ["description", "habits", "medicalHistory"];

/**
 * One client's information sections in `SECTION_ORDER`. Returns copies, so a
 * caller that edits what it was given cannot change the fixtures.
 */
export function selectClientInfoSections(
  sections: readonly ClientInfoSection[],
  clientId: string,
): ClientInfoSection[] {
  return sections
    .filter((section) => section.clientId === clientId)
    .sort((a, b) => SECTION_ORDER.indexOf(a.kind) - SECTION_ORDER.indexOf(b.kind))
    .map((section) => ({ ...section }));
}

export async function getClientInfoSections(clientId: string): Promise<ClientInfoSection[]> {
  return selectClientInfoSections(CLIENT_INFO_SECTIONS, clientId);
}
