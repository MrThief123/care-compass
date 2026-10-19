"use server";

/**
 * `documents` domain Server Actions (F0-13). Validated with Zod at the trust boundary
 * (ARCHITECTURE.md §12.4); result shape per ARCHITECTURE.md §4, never throwing to the
 * client for an expected failure. Authority is the database's (`can_access_client_documents`,
 * `documents` RLS, the `client-documents` bucket's own RLS) — these actions are not the
 * only lock, the same relationship F0-13's PRD describes for `transfer_client_organisation`.
 *
 * Reading a client's or an event's documents is a separate, existing contract
 * (`src/server/documents/queries.ts`, UI-04/FAM-UI-04) that this feature does not touch;
 * wiring its Supabase mode is a later Phase 3 feature (FAM-08, FAM-09, FAM-15, CAR-04).
 */
import { randomUUID } from "node:crypto";

import { z } from "zod";

import { validateDocumentFile } from "@/lib/documents/validate-document";
import { createClient } from "@/lib/supabase/server";
import { getDataSourceMode } from "@/server/data-source";
import { refreshCachedPages } from "@/server/refresh-cache";

import { detachDocumentRow, insertDocumentRow, selectDocumentStoragePath } from "./db";

export type DocumentActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "VALIDATION" | "NOT_ALLOWED" | "NOT_FOUND" | "NOT_AVAILABLE" | "UNEXPECTED";
        message: string;
      };
    };

const NOT_AVAILABLE_MESSAGE = "Documents are not available yet.";
const UPLOAD_FAILED_MESSAGE = "Couldn't upload that file. Try again.";
const NOT_FOUND_MESSAGE = "Couldn't find that document.";

/** PRD: a short-lived signed URL. 60 seconds, as PRD.md's PROPOSED default. */
const SIGNED_URL_TTL_SECONDS = 60;

// `z.guid()`, not `z.uuid()`: Postgres accepts any 8-4-4-4-12 hex id and seed ids carry no
// RFC version bits (F0-22 FD-07).
const LinkInputSchema = z.object({
  eventId: z.guid(),
  documentIds: z.array(z.guid()).max(50),
});

const UploadInputSchema = z.object({
  clientId: z.uuid(),
  eventId: z.uuid().optional(),
});

/**
 * AC-01, AC-03, AC-04, AC-06 (PRD Functional Requirements): uploads `file` to the private
 * `client-documents` bucket, then creates its `documents` row — the row is created only
 * after the upload succeeds, and if the row can't be created the object is removed, so a
 * failed upload never leaves an orphan of either kind. `formData` carries `clientId`, an
 * optional `eventId`, and `file` (a browser File), the Server Actions convention for file
 * uploads (Next.js forms guide).
 */
async function uploadDocumentImpl(
  formData: FormData,
): Promise<DocumentActionResult<{ documentId: string; storagePath: string }>> {
  if (getDataSourceMode() === "mock") {
    return { ok: false, error: { code: "NOT_AVAILABLE", message: NOT_AVAILABLE_MESSAGE } };
  }

  const parsed = UploadInputSchema.safeParse({
    clientId: formData.get("clientId"),
    eventId: formData.get("eventId") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Choose a client to attach the file to." },
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: { code: "VALIDATION", message: "Choose a file to upload." } };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validated = validateDocumentFile({
    name: file.name,
    declaredType: file.type,
    size: file.size,
    bytes,
  });
  if (!validated.ok) {
    return { ok: false, error: { code: "VALIDATION", message: validated.message } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "NOT_ALLOWED", message: "Sign in to upload a file." } };
  }

  const documentId = randomUUID();
  const storagePath = `clients/${parsed.data.clientId}/${documentId}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(storagePath, bytes, { contentType: validated.mimeType, upsert: false });
  if (uploadError) {
    const notAllowed = /row-level security|not found|Unauthorized/i.test(uploadError.message);
    return {
      ok: false,
      error: { code: notAllowed ? "NOT_ALLOWED" : "UNEXPECTED", message: UPLOAD_FAILED_MESSAGE },
    };
  }

  const { error: insertError } = await insertDocumentRow(supabase, {
    id: documentId,
    clientId: parsed.data.clientId,
    eventId: parsed.data.eventId ?? null,
    storagePath,
    filename: file.name,
    mimeType: validated.mimeType,
    sizeBytes: file.size,
    uploadedBy: user.id,
  });
  if (insertError) {
    // No orphan object either: the upload succeeded but the row could not be created.
    await supabase.storage.from("client-documents").remove([storagePath]);
    const notAllowed = insertError.code === "42501";
    return {
      ok: false,
      error: { code: notAllowed ? "NOT_ALLOWED" : "UNEXPECTED", message: UPLOAD_FAILED_MESSAGE },
    };
  }

  return { ok: true, data: { documentId, storagePath } };
}

export async function uploadDocument(
  ...args: Parameters<typeof uploadDocumentImpl>
): ReturnType<typeof uploadDocumentImpl> {
  const result = await uploadDocumentImpl(...args);
  if ((result as { ok?: boolean }).ok !== false) refreshCachedPages();
  return result;
}

/** AC-02: a signed URL for an existing, accessible document. RLS decides "accessible". */
export async function getDocumentUrl(
  documentId: string,
): Promise<DocumentActionResult<{ url: string; expiresInSeconds: number }>> {
  if (getDataSourceMode() === "mock") {
    return { ok: false, error: { code: "NOT_AVAILABLE", message: NOT_AVAILABLE_MESSAGE } };
  }
  if (!z.uuid().safeParse(documentId).success) {
    return { ok: false, error: { code: "VALIDATION", message: NOT_FOUND_MESSAGE } };
  }

  const supabase = await createClient();
  const { data: document } = await selectDocumentStoragePath(supabase, documentId);
  // A row RLS hides and a row that doesn't exist look the same to the caller (no
  // enumeration), the same choice F0-07's sign-in makes for credentials.
  if (!document) {
    return { ok: false, error: { code: "NOT_FOUND", message: NOT_FOUND_MESSAGE } };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("client-documents")
    .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS);
  if (signedError || !signed) {
    return { ok: false, error: { code: "UNEXPECTED", message: "Couldn't open that document." } };
  }

  return { ok: true, data: { url: signed.signedUrl, expiresInSeconds: SIGNED_URL_TTL_SECONDS } };
}

/** AC-05: perpetual retention (CIS3) — sets `detached_at`; the row and the object stay. */
async function detachDocumentImpl(documentId: string): Promise<DocumentActionResult> {
  if (getDataSourceMode() === "mock") {
    return { ok: false, error: { code: "NOT_AVAILABLE", message: NOT_AVAILABLE_MESSAGE } };
  }
  if (!z.uuid().safeParse(documentId).success) {
    return { ok: false, error: { code: "VALIDATION", message: NOT_FOUND_MESSAGE } };
  }

  const supabase = await createClient();
  const { data, error } = await detachDocumentRow(supabase, documentId);
  if (error) {
    return { ok: false, error: { code: "UNEXPECTED", message: "Couldn't detach that document." } };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: { code: "NOT_FOUND", message: NOT_FOUND_MESSAGE } };
  }

  return { ok: true, data: undefined };
}

export async function detachDocument(
  ...args: Parameters<typeof detachDocumentImpl>
): ReturnType<typeof detachDocumentImpl> {
  const result = await detachDocumentImpl(...args);
  if ((result as { ok?: boolean }).ok !== false) refreshCachedPages();
  return result;
}

/**
 * F0-23 (CHG-045): after Add event's `createEvent` returns an id, links the files chosen
 * before the event existed. Each id goes through the guarded `link_document_to_event`
 * function (the only way `documents.event_id` is set), so the database decides who may link
 * what. One refusal never stops the others: `failedIds` lists the documents that did not
 * attach, and the caller names them to the user. Errors carry no filename, id or detail.
 */
async function linkDocumentsToEventImpl(input: {
  eventId: string;
  documentIds: string[];
}): Promise<DocumentActionResult<{ failedIds: string[] }>> {
  if (getDataSourceMode() === "mock") {
    return { ok: false, error: { code: "NOT_AVAILABLE", message: NOT_AVAILABLE_MESSAGE } };
  }

  const parsed = LinkInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Couldn't attach those files to the event." },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "NOT_ALLOWED", message: "Sign in to attach files." } };
  }

  const failedIds: string[] = [];
  for (const documentId of parsed.data.documentIds) {
    try {
      const { error } = await supabase.rpc("link_document_to_event", {
        p_document_id: documentId,
        p_event_id: parsed.data.eventId,
      });
      if (error) failedIds.push(documentId);
    } catch {
      failedIds.push(documentId);
    }
  }

  return { ok: true, data: { failedIds } };
}

export async function linkDocumentsToEvent(
  ...args: Parameters<typeof linkDocumentsToEventImpl>
): ReturnType<typeof linkDocumentsToEventImpl> {
  const result = await linkDocumentsToEventImpl(...args);
  if ((result as { ok?: boolean }).ok !== false) refreshCachedPages();
  return result;
}
