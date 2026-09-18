/**
 * Mock (fixture-backed) implementation of the `clients` domain contract.
 * Read only by `src/server/clients/queries.ts` — never imported directly
 * by `src/app` or `src/features`.
 */
import { ageFromDob } from "@/lib/format/age";
import { CLIENTS, ORGANISATION, REFERENCE_DATE } from "@/mocks/fixtures";

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
