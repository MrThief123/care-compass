import "server-only";

import type { Database } from "@/lib/supabase/database.types";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Typed access to the `documents` table (F0-13), which `database.types.ts` does not know
 * yet — not regenerated, for the same reason as F0-17's sign-up feature (FD-06):
 * regenerating changes about 1,500 lines and breaks typecheck on `src/app/api/test/route.ts`,
 * outside this lane. The one cast lives here; remove it when the types are regenerated.
 */
type Supabase = SupabaseClient<Database>;

type DbResult<T> = PromiseLike<{
  data: T | null;
  error: { code?: string; message: string } | null;
}>;

interface DocumentsTable {
  insert(row: Record<string, unknown>): {
    select(columns: string): { single(): DbResult<{ id: string }> };
  };
  select(columns: string): {
    eq(column: string, value: string): { maybeSingle(): DbResult<{ storage_path: string }> };
  };
  update(values: Record<string, unknown>): {
    eq(column: string, value: string): { select(columns: string): DbResult<{ id: string }[]> };
  };
}

function documentsTable(supabase: Supabase): DocumentsTable {
  return (supabase.from as unknown as (table: string) => DocumentsTable)("documents");
}

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
  return documentsTable(supabase)
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
  return documentsTable(supabase).select("storage_path").eq("id", documentId).maybeSingle();
}

/** AC-05: sets `detached_at`; only that column is grantable (RLS + column grant). */
export async function detachDocumentRow(supabase: Supabase, documentId: string) {
  return documentsTable(supabase)
    .update({ detached_at: new Date().toISOString() })
    .eq("id", documentId)
    .select("id");
}
