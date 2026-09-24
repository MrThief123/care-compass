/**
 * Mock (fixture-backed) implementation of the `documents` domain contract.
 * Read only by `src/server/documents/queries.ts` — never imported directly by
 * `src/app` or `src/features`.
 */
import { DOCUMENTS, EVENT_DOCUMENTS } from "@/mocks/fixtures";
import type { DocumentRef, EventDocument } from "@/types/domain";

/** Oldest upload first (by instant, not string); ties by id ascending. */
function oldestUploadFirst(
  a: Pick<DocumentRef, "id" | "uploadedAt">,
  b: Pick<DocumentRef, "id" | "uploadedAt">,
): number {
  const aUploaded = Date.parse(a.uploadedAt);
  const bUploaded = Date.parse(b.uploadedAt);
  if (aUploaded !== bUploaded) return aUploaded < bUploaded ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/**
 * The documents attached to one event of one client. Both ids must match, so a
 * document is never returned to a client it does not belong to. Does not
 * reorder the array it is given.
 */
export function selectEventDocuments(
  documents: readonly EventDocument[],
  clientId: string,
  eventId: string,
): EventDocument[] {
  return documents
    .filter((document) => document.clientId === clientId && document.eventId === eventId)
    .sort(oldestUploadFirst);
}

export async function getEventDocuments(
  clientId: string,
  eventId: string,
): Promise<EventDocument[]> {
  return selectEventDocuments(EVENT_DOCUMENTS, clientId, eventId);
}

/**
 * The client-level documents of one client: those not attached to an event.
 * Oldest upload first. Returns copies, so a caller that edits what it was
 * given cannot change the fixtures.
 */
export function selectClientDocuments(
  documents: readonly DocumentRef[],
  clientId: string,
): DocumentRef[] {
  return documents
    .filter((document) => document.clientId === clientId && document.eventId === undefined)
    .sort(oldestUploadFirst)
    .map((document) => ({ ...document }));
}

export async function getClientDocuments(clientId: string): Promise<DocumentRef[]> {
  return selectClientDocuments(DOCUMENTS, clientId);
}
