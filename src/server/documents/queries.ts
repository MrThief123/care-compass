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
import { getDataSourceMode } from "@/server/data-source";
import type { ClientDocument, DocumentRef, EventDocument } from "@/types/domain";

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

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, client_id, event_id, filename, mime_type, size_bytes, uploaded_at, uploader:profiles!documents_uploaded_by_fkey(first_name, last_name)",
    )
    .eq("client_id", clientId)
    .eq("event_id", eventId)
    .is("detached_at", null)
    .order("uploaded_at", { ascending: true })
    .order("id", { ascending: true });
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id!,
    name: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
    // Left out when the uploader's own profile is not one this reader may see (RLS).
    uploadedBy: row.uploader ? `${row.uploader.first_name} ${row.uploader.last_name}` : undefined,
  }));
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

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, client_id, filename, uploaded_at, uploader:profiles!documents_uploaded_by_fkey(first_name, last_name)",
    )
    .eq("client_id", clientId)
    .is("event_id", null)
    .is("detached_at", null)
    .order("uploaded_at", { ascending: true })
    .order("id", { ascending: true });
  // The message names no client or carer (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getClientDocuments: could not load the documents.");

  return data.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    name: row.filename,
    // The bucket is private: a file is opened through a short-lived signed URL
    // (`getDocumentUrl`, F0-13), never a stored link.
    url: "",
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploader ? `${row.uploader.first_name} ${row.uploader.last_name}` : undefined,
  }));
}

/**
 * Every non-detached document of a client for the Documents page (F0-25, CHG-058): the
 * client-level files and the files attached to care events, newest upload first (ties by id).
 * An unknown client returns `[]`. RLS decides what the caller may see. Metadata only: opening
 * one is `getDocumentUrl`, and the whole set is the `download-all` route.
 */
export async function getAllClientDocuments(clientId: string): Promise<ClientDocument[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getAllClientDocuments(clientId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, client_id, event_id, filename, mime_type, size_bytes, uploaded_at, uploader:profiles!documents_uploaded_by_fkey(first_name, last_name), event:care_events(title)",
    )
    .eq("client_id", clientId)
    .is("detached_at", null)
    .order("uploaded_at", { ascending: false })
    .order("id", { ascending: true });
  // The message names no client or carer (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getAllClientDocuments: could not load the documents.");

  return data.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id ?? undefined,
    eventTitle: row.event?.title ?? undefined,
    name: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploader ? `${row.uploader.first_name} ${row.uploader.last_name}` : undefined,
  }));
}
