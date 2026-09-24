/**
 * Data the Family · Info screen needs, read only through the `src/server/**`
 * contract (CLAUDE.md §7). The client's name and summary line come with the
 * sections and documents so the screen is one loader call, one error state.
 */
import {
  getClientHeaderSummary,
  getClientInfoSections,
  type ClientHeaderSummary,
} from "@/server/clients/queries";
import { getClientDocuments } from "@/server/documents/queries";
import type { ClientInfoSection, DocumentRef } from "@/types/domain";

export interface FamilyInfoData {
  /** Only what the screen draws: the last name and date of birth stay out. */
  client: { firstName: string; meta: string };
  /** Description, Habits, Medical history, in the order they are drawn. */
  sections: ClientInfoSection[];
  /** The client's own documents (not any one event's), oldest upload first. */
  documents: DocumentRef[];
}

/**
 * The line under the client's name, "78 years · Preston VIC · Banksia Home
 * Care", the same one the shell header draws. A missing suburb or organisation
 * is left out with its separator.
 */
export function clientMetaLine({
  age,
  suburb,
  organisationName,
}: Pick<ClientHeaderSummary, "age" | "suburb" | "organisationName">): string {
  return [`${age} years`, suburb, organisationName]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

/** Rejects as a whole if any read rejects: the screen shows one error state, never half a page. */
export async function loadFamilyInfoData(clientId: string): Promise<FamilyInfoData> {
  const [header, sections, documents] = await Promise.all([
    getClientHeaderSummary(clientId),
    getClientInfoSections(clientId),
    getClientDocuments(clientId),
  ]);

  return {
    client: { firstName: header.firstName, meta: clientMetaLine(header) },
    sections,
    documents,
  };
}
