/**
 * Mock (fixture-backed) implementation of the `clients` domain contract.
 * Read only by `src/server/clients/queries.ts` — never imported directly
 * by `src/app` or `src/features`.
 */
import { ageFromDob } from "@/lib/format/age";
import {
  CLIENT_CUSTOM_SECTIONS,
  CLIENT_INFO_SECTIONS,
  CLIENTS,
  ORGANISATION,
  OTHER_ORGANISATIONS,
  REFERENCE_DATE,
} from "@/mocks/fixtures";
import type { ClientDetails } from "@/server/clients/client-details-schema";
import type { ClientCustomSection, ClientInfoSection, ClientInfoSectionKind } from "@/types/domain";

export interface ClientHeaderSummary {
  id: string;
  firstName: string;
  lastName: string;
  /** Whole years, computed from dob as of "now" (Australia/Melbourne). Omitted when no date of birth is stored. */
  age?: number;
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

/** One row of the Change organisation picker (FAM-13). */
export interface OrganisationChoice {
  id: string;
  name: string;
  /** The organisation the client is with now; it cannot be chosen. */
  isCurrent: boolean;
}

/** Every fixture organisation by name, the client's current one flagged. An unknown client is an error. */
export async function getOrganisationChoices(clientId: string): Promise<OrganisationChoice[]> {
  const client = CLIENTS.find((candidate) => candidate.id === clientId);
  if (!client) {
    throw new Error(`getOrganisationChoices: no client found for id "${clientId}".`);
  }
  return [ORGANISATION, ...OTHER_ORGANISATIONS]
    .map(({ id, name }) => ({ id, name, isCurrent: id === client.organisationId }))
    .sort((a, b) => a.name.localeCompare(b.name));
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

/** F0-26: the client's custom sections, oldest first, as copies. */
export async function getClientCustomSections(clientId: string): Promise<ClientCustomSection[]> {
  return CLIENT_CUSTOM_SECTIONS.filter((section) => section.clientId === clientId).map(
    (section) => ({ ...section }),
  );
}

/**
 * F0-28: each fixture client's personal details. The date of birth and suburb come from the
 * client fixture; nothing else is set until a save.
 */
const CLIENT_DETAILS = new Map<string, ClientDetails>(
  CLIENTS.map((client) => [
    client.id,
    { dateOfBirth: client.dob, ...(client.suburb ? { suburb: client.suburb } : {}) },
  ]),
);

export async function getClientDetails(clientId: string): Promise<ClientDetails> {
  const details = CLIENT_DETAILS.get(clientId);
  if (!details) throw new Error(`getClientDetails: no client found for id "${clientId}".`);
  return { ...details };
}

/**
 * Phase 1 mock mutation (F0-28): replaces the client's details, and keeps the header's date of
 * birth and suburb in step. False for an unknown client.
 */
export async function saveClientDetails(
  clientId: string,
  details: ClientDetails,
): Promise<boolean> {
  const client = CLIENTS.find((candidate) => candidate.id === clientId);
  if (!client) return false;
  CLIENT_DETAILS.set(clientId, { ...details });
  // The fixture type needs a date of birth, so a cleared one keeps the old age in the header.
  if (details.dateOfBirth) client.dob = details.dateOfBirth;
  if (details.suburb) client.suburb = details.suburb;
  else delete client.suburb;
  return true;
}
