import { describe, expect, it } from "vitest";

import { MAX_DOCUMENT_SIZE_BYTES, validateDocumentFile } from "./validate-document";

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const HEIC_BYTES = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]); // ftyp box, brand "heic"
const DOCX_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]);
const EXE_BYTES = new Uint8Array([0x4d, 0x5a, 0x90, 0, 0, 0]); // "MZ" — a Windows executable

function file(overrides: Partial<Parameters<typeof validateDocumentFile>[0]> = {}) {
  return validateDocumentFile({
    name: "Care plan.pdf",
    declaredType: "application/pdf",
    size: PDF_BYTES.length,
    bytes: PDF_BYTES,
    ...overrides,
  });
}

describe("[F0-13][AC-01] validateDocumentFile — allowed types", () => {
  it("[F0-13][AC-01] accepts a real PDF", () => {
    expect(file()).toEqual({ ok: true, mimeType: "application/pdf" });
  });

  it("[F0-13][AC-01] accepts a real PNG", () => {
    expect(
      file({
        name: "Photo.png",
        declaredType: "image/png",
        size: PNG_BYTES.length,
        bytes: PNG_BYTES,
      }),
    ).toEqual({ ok: true, mimeType: "image/png" });
  });

  it("[F0-13][AC-01] accepts a real JPEG", () => {
    expect(
      file({
        name: "Photo.jpg",
        declaredType: "image/jpeg",
        size: JPEG_BYTES.length,
        bytes: JPEG_BYTES,
      }),
    ).toEqual({ ok: true, mimeType: "image/jpeg" });
  });

  it("[F0-13][AC-01] accepts a real HEIC", () => {
    expect(
      file({
        name: "Photo.heic",
        declaredType: "image/heic",
        size: HEIC_BYTES.length,
        bytes: HEIC_BYTES,
      }),
    ).toEqual({ ok: true, mimeType: "image/heic" });
  });

  it("[F0-13][AC-01] accepts a real DOCX", () => {
    expect(
      file({
        name: "Report.docx",
        declaredType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: DOCX_BYTES.length,
        bytes: DOCX_BYTES,
      }),
    ).toEqual({
      ok: true,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  });
});

describe("[F0-13][AC-03] validateDocumentFile — rejections", () => {
  it("[F0-13][AC-03] rejects a type not in the allowed list, with a plain-language message", () => {
    const result = file({
      name: "clip.mp4",
      declaredType: "video/mp4",
      size: 10,
      bytes: new Uint8Array(10),
    });
    expect(result).toEqual({
      ok: false,
      message: "That file type isn't supported. Upload a PDF, JPEG, PNG, HEIC or Word document.",
    });
  });

  it("[F0-13][AC-03] rejects an executable renamed to claim it's a PDF (signature mismatch)", () => {
    const result = file({ size: EXE_BYTES.length, bytes: EXE_BYTES });
    expect(result).toEqual({
      ok: false,
      message: "That file doesn't look like the type it claims to be.",
    });
  });

  it("[F0-13][AC-03] rejects a file over 20MB", () => {
    const result = file({ size: MAX_DOCUMENT_SIZE_BYTES + 1 });
    expect(result).toEqual({ ok: false, message: "Files must be 20MB or smaller." });
  });

  it("[F0-13][AC-03] accepts exactly 20MB", () => {
    expect(file({ size: MAX_DOCUMENT_SIZE_BYTES })).toEqual({
      ok: true,
      mimeType: "application/pdf",
    });
  });

  it("[F0-13][PRD] rejects an empty file", () => {
    expect(file({ size: 0 })).toEqual({ ok: false, message: "That file is empty." });
  });

  it("[F0-13][PRD] rejects a blank filename", () => {
    expect(file({ name: "   " })).toEqual({ ok: false, message: "Choose a file to upload." });
  });
});
