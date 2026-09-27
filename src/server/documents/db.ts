import "server-only";

import type { Database } from "@/lib/supabase/database.types";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Typed access to the `documents` table, now that `database.types.ts` knows it (F0-18 regenerated it). */
type Supabase = SupabaseClient<Database>;

/** AC-01: creates the row for an object already uploaded at `storagePath`. */
export async function insertDocumentRow(
  supabase: Supabase,
  row: {
    id: string;
    clientId: string;
    eventId: string | null;
    storagePath: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    uploadedBy: string;
  },
) {
  return supabase
    .from("documents")
    .insert({
      id: row.id,
      client_id: row.clientId,
      event_id: row.eventId,
      storage_path: row.storagePath,
      filename: row.filename,
      mime_type: row.mimeType,
      size_bytes: row.sizeBytes,
      uploaded_by: row.uploadedBy,
    })
    .select("id")
    .single();
}

/** AC-02: the object path behind a document, if this caller can read it (RLS). */
export async function selectDocumentStoragePath(supabase: Supabase, documentId: string) {
  return supabase.from("documents").select("storage_path").eq("id", documentId).maybeSingle();
}

/** AC-05: sets `detached_at`; only that column is grantable (RLS + column grant). */
export async function detachDocumentRow(supabase: Supabase, documentId: string) {
  return supabase
    .from("documents")
    .update({ detached_at: new Date().toISOString() })
    .eq("id", documentId)
    .select("id");
}
