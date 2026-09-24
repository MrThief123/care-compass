/**
 * `documents` domain query contract. Authored by UI-04 (CHG-004): the first
 * screen to show documents (FAM-UI-07 Task detail) needed a read, and per
 * CHG-002 every domain other than `budget` and `events` is authored from
 * scratch. Same data-source-adapter shape as the other domains
 * (ARCHITECTURE.md §3.2). Screens must import from here, never from
 * `src/mocks` directly (lint-enforced).
 *
 * Metadata only. Opening or downloading a document is a short-lived signed
 * URL (F0-13) and is not part of this contract.
 */
import * as mock from "@/mocks/queries/documents";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { DocumentRef, EventDocument } from "@/types/domain";

/**
 * The documents attached to one care event of one client, oldest upload first
 * (ties by id). An event with none returns `[]`. A document is only ever
 * returned to the client it belongs to: a client id and event id that do not
 * belong together return `[]`. A detached document (F0-13 `detached_at`) is
 * not returned.
 */
export async function getEventDocuments(
  clientId: string,
  eventId: string,
): Promise<EventDocument[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getEventDocuments(clientId, eventId);
  }
  notImplementedForSupabase("documents", "getEventDocuments");
}

/**
 * The documents that belong to a client as a whole, not to one care event
 * (Family · Info's Documentation card, FAM-UI-04, CHG-018). Oldest upload
 * first (ties by id). A client with none, or an unknown client, returns `[]`,
 * and a document is only ever returned to the client it belongs to. Metadata
 * only, like `getEventDocuments`.
 */
export async function getClientDocuments(clientId: string): Promise<DocumentRef[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getClientDocuments(clientId);
  }
  notImplementedForSupabase("documents", "getClientDocuments");
}
