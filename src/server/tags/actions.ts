"use server";

/**
 * F0-29 `setDocumentTags`: replaces a document's tags from the Documents page. Validated with
 * `TagNamesSchema` at the trust boundary (ARCHITECTURE.md §12.4); the result shape is
 * ARCHITECTURE.md §4's. Authority is the database's: `set_document_tags` refuses anyone who is
 * not a family member of the client. An event's tags are saved by `createEvent` / `updateEvent`.
 */
import { getDataSourceMode } from "@/server/data-source";
import type { ActionResult } from "@/server/events/actions";
import { refreshCachedPages } from "@/server/refresh-cache";

import { TagNamesSchema } from "./tag-input";

const FAILED = "Couldn't save the tags. Try again.";
const INVALID = "Check the tags and try again.";
const NOT_ALLOWED = "Only the client's family can change tags.";

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function setDocumentTagsImpl(
  clientId: string,
  documentId: string,
  names: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = TagNamesSchema.safeParse(names);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: INVALID } };

  if (getDataSourceMode() === "mock") {
    const mock = await import("@/mocks/queries/tags");
    return (await mock.setDocumentTags(clientId, documentId, parsed.data))
      ? { ok: true, data: undefined }
      : { ok: false, error: { code: "NOT_FOUND", message: FAILED } };
  }

  if (!ID_PATTERN.test(documentId)) {
    return { ok: false, error: { code: "VALIDATION", message: FAILED } };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.rpc("set_document_tags", {
      p_document_id: documentId,
      p_names: parsed.data,
    });
    if (!error) return { ok: true, data: undefined };
    // Fixed messages by error code: the database's text may name a client.
    if (error.code === "42501") {
      return { ok: false, error: { code: "NOT_ALLOWED", message: NOT_ALLOWED } };
    }
    if (error.code === "22023") {
      return { ok: false, error: { code: "VALIDATION", message: INVALID } };
    }
    return { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
  } catch (error) {
    // A feature tag and the error's class only (ARCHITECTURE.md §12.5).
    console.error(
      "[tags] setDocumentTags failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
  }
}

export async function setDocumentTags(
  ...args: Parameters<typeof setDocumentTagsImpl>
): ReturnType<typeof setDocumentTagsImpl> {
  const result = await setDocumentTagsImpl(...args);
  if (result.ok) refreshCachedPages();
  return result;
}
