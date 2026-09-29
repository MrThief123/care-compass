/**
 * File-type and size validation for uploaded documents (F0-13, PD-051/OQ-26).
 * Pure logic, no Supabase — kept separate from `src/server/documents/actions.ts` so it can
 * be unit-tested directly and reused by any future upload surface (FAM-08, FAM-09, FAM-15,
 * CAR-04) without pulling in a server action.
 *
 * The declared MIME type and size are checked against PD-051's allowlist, then the file's
 * own bytes are checked against a signature for that type — "verified from file signature
 * where feasible, not only extension" (PRD Security). This is a shape check (does it start
 * like a PDF/PNG/JPEG/HEIF-family container/ZIP), not a full parse, so it does not catch a
 * disguised file that begins with valid bytes; it does catch the common case this PRD line
 * is aimed at, a renamed executable or script.
 */

/** Kept in sync with the CHECK constraint and the bucket's `allowed_mime_types` in `supabase/migrations/20260927020000_documents.sql`. */
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedDocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

/** PD-051: 20MB per file. */
export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * An ISO base media file (the HEIC/HEIF family, also MP4/MOV) has a 4-byte box size then
 * the ASCII box type `ftyp` at offset 4. Brand codes (`heic`, `mif1`, `heix`, ...) vary by
 * device, so this checks the container shape rather than one brand.
 */
function isHeifContainer(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  );
}

const SIGNATURE_MATCHES: Record<AllowedDocumentMimeType, (bytes: Uint8Array) => boolean> = {
  "application/pdf": (bytes) => startsWith(bytes, [0x25, 0x50, 0x44, 0x46]), // %PDF
  "image/jpeg": (bytes) => startsWith(bytes, [0xff, 0xd8, 0xff]),
  "image/png": (bytes) => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/heic": isHeifContainer,
  "image/heif": isHeifContainer,
  // DOCX is a ZIP; this only confirms "some ZIP", not that it contains a Word document.
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (bytes) =>
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]),
};

export interface DocumentFileInput {
  name: string;
  /** The browser/OS-declared MIME type — not trusted alone (PRD Security). */
  declaredType: string;
  size: number;
  bytes: Uint8Array;
}

export type DocumentValidationResult =
  | { ok: true; mimeType: AllowedDocumentMimeType }
  | { ok: false; message: string };

const UNSUPPORTED_TYPE_MESSAGE =
  "That file type isn't supported. Upload a PDF, JPEG, PNG, HEIC or Word document.";

/** AC-03: a disallowed type or an over-size/empty file is rejected with a plain-language message. */
export function validateDocumentFile(input: DocumentFileInput): DocumentValidationResult {
  if (!input.name.trim()) {
    return { ok: false, message: "Choose a file to upload." };
  }
  if (input.size <= 0) {
    return { ok: false, message: "That file is empty." };
  }
  if (input.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { ok: false, message: "Files must be 20MB or smaller." };
  }
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(input.declaredType)) {
    return { ok: false, message: UNSUPPORTED_TYPE_MESSAGE };
  }

  const mimeType = input.declaredType as AllowedDocumentMimeType;
  if (!SIGNATURE_MATCHES[mimeType](input.bytes)) {
    return { ok: false, message: "That file doesn't look like the type it claims to be." };
  }

  return { ok: true, mimeType };
}
