/**
 * Mock (fixture-backed) implementation of the `documents` domain contract.
 * Read only by `src/server/documents/queries.ts` — never imported directly by
 * `src/app` or `src/features`.
 */
import { CARE_EVENTS, DOCUMENTS, EVENT_DOCUMENTS } from "@/mocks/fixtures";
import type { ClientDocument, DocumentRef, EventDocument } from "@/types/domain";

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

/** Type and size of the client-level fixtures, which `DocumentRef` does not carry. */
const CLIENT_DOCUMENT_DETAILS: Record<string, { mimeType: string; sizeBytes: number }> = {
  "doc-margaret-care-plan": { mimeType: "application/pdf", sizeBytes: 152_400 },
  "doc-margaret-medication-schedule": { mimeType: "application/pdf", sizeBytes: 64_800 },
};
const DEFAULT_DETAILS = { mimeType: "application/pdf", sizeBytes: 100_000 };

/** Newest upload first (by instant); ties by id ascending. */
function newestUploadFirst(
  a: Pick<ClientDocument, "id" | "uploadedAt">,
  b: Pick<ClientDocument, "id" | "uploadedAt">,
): number {
  return oldestUploadFirst(b, a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/**
 * Every document of one client, client-level and event-attached, newest upload first (F0-25).
 * Returns copies, so a caller that edits what it was given cannot change the fixtures.
 */
export async function getAllClientDocuments(clientId: string): Promise<ClientDocument[]> {
  const clientLevel: ClientDocument[] = selectClientDocuments(DOCUMENTS, clientId).map(
    (document) => ({
      id: document.id,
      clientId: document.clientId,
      name: document.name,
      ...(CLIENT_DOCUMENT_DETAILS[document.id] ?? DEFAULT_DETAILS),
      uploadedAt: document.uploadedAt,
      uploadedBy: document.uploadedBy,
    }),
  );
  const eventTitles = new Map(CARE_EVENTS.map((event) => [event.id, event.title]));
  const attached: ClientDocument[] = EVENT_DOCUMENTS.filter(
    (document) => document.clientId === clientId,
  ).map((document) => ({ ...document, eventTitle: eventTitles.get(document.eventId) }));

  return [...clientLevel, ...attached].sort(newestUploadFirst);
}
