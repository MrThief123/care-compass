/**
 * Data the Family · Info screen needs, read only through the `src/server/**`
 * contract (CLAUDE.md §7). The client's name and summary line are not read
 * here: the shell header already shows them (FD-08).
 */
import { getClientInfoSections } from "@/server/clients/queries";
import { getClientDocuments } from "@/server/documents/queries";
import type { ClientInfoSection, DocumentRef } from "@/types/domain";

export interface FamilyInfoData {
  /** Description, Habits, Medical history, in the order they are drawn. */
  sections: ClientInfoSection[];
  /** The client's own documents (not any one event's), oldest upload first. */
  documents: DocumentRef[];
}

/** Rejects as a whole if either read rejects: the screen shows one error state, never half a page. */
export async function loadFamilyInfoData(clientId: string): Promise<FamilyInfoData> {
  const [sections, documents] = await Promise.all([
    getClientInfoSections(clientId),
    getClientDocuments(clientId),
  ]);

  return { sections, documents };
}
