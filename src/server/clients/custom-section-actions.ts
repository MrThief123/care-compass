"use server";

/**
 * F0-26: add, edit and remove a client's custom Client Details sections. Validated at the trust
 * boundary (ARCHITECTURE.md §12.4) with the rules in `custom-section-input.ts`; result shape per
 * ARCHITECTURE.md §4, never throwing to the client for an expected failure. Who may write is
 * RLS's decision (family, a carer on shift, an AAL2 admin of the client's organisation), so a
 * refusal or a write that touches no row is reported, not prevented, here.
 */
import { z } from "zod";

import {
  CUSTOM_SECTION_MESSAGES,
  type CustomSectionField,
  parseCustomSectionInput,
} from "@/server/clients/custom-section-input";
import { getDataSourceMode } from "@/server/data-source";
import { refreshCachedPages } from "@/server/refresh-cache";

export type CustomSectionActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "VALIDATION" | "LIMIT" | "NOT_ALLOWED" | "NOT_FOUND" | "NOT_AVAILABLE" | "UNEXPECTED";
        message: string;
        field?: CustomSectionField;
      };
    };

type Failure = Extract<CustomSectionActionResult, { ok: false }>;

// `guid`, not `uuid`: Postgres accepts any 8-4-4-4-12 hex id, and seed ids need not carry RFC version bits.
const IdSchema = z.guid();

const TABLE = "client_custom_info_sections";
const SAVE_FAILED = "Couldn't save your changes. Try again.";
const REMOVE_FAILED = "Couldn't remove the section. Try again.";
const SHIFT_ENDED = "Your shift has ended, so changes can't be saved.";
const GONE = "This section no longer exists.";

const NOT_AVAILABLE: Failure = {
  ok: false,
  error: { code: "NOT_AVAILABLE", message: "Saving changes is not available yet." },
};
const BAD_ID: Failure = {
  ok: false,
  error: { code: "VALIDATION", message: "That section can't be saved. Reload and try again." },
};
const SIGNED_OUT: Failure = {
  ok: false,
  error: { code: "NOT_ALLOWED", message: "Sign in to save your changes." },
};

function fail(code: Failure["error"]["code"], message: string): Failure {
  return { ok: false, error: { code, message } };
}

/** Fixed messages by error code: the database's text may name a client. */
function fromDatabaseError(error: { code?: string; message: string }, fallback: string): Failure {
  switch (error.code) {
    case "23505":
      return {
        ok: false,
        error: { code: "VALIDATION", field: "title", message: CUSTOM_SECTION_MESSAGES.titleTaken },
      };
    case "P0001":
      if (error.message.includes("limit")) return fail("LIMIT", CUSTOM_SECTION_MESSAGES.limit);
      return fail("UNEXPECTED", fallback);
    case "42501":
      return fail("NOT_ALLOWED", SHIFT_ENDED);
    default:
      return fail("UNEXPECTED", fallback);
  }
}

function logFailure(action: string, error: unknown) {
  // A feature tag and the error's class only (ARCHITECTURE.md §12.5).
  console.error(`[clients] ${action} failed:`, error instanceof Error ? error.name : "unknown");
}

async function signedInClient() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  return { supabase, userId: auth.user?.id ?? null };
}

/**
 * A write that touched no row: RLS hid it from the writer (a carer whose shift ended) or someone
 * removed it. Read it back to tell which; `null` means it is gone.
 */
async function stillExists(
  supabase: Awaited<ReturnType<typeof signedInClient>>["supabase"],
  clientId: string,
  sectionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", sectionId)
    .eq("client_id", clientId)
    .maybeSingle();
  return Boolean(data);
}

/** AC-02: adds a section at the end of the client's list and returns its id. */
async function addClientCustomSectionImpl(
  clientId: string,
  title: string,
  content: string,
): Promise<CustomSectionActionResult<{ id: string }>> {
  if (getDataSourceMode() === "mock") return NOT_AVAILABLE;
  if (!IdSchema.safeParse(clientId).success) return BAD_ID;
  const input = parseCustomSectionInput({ title, content });
  if (!input.ok) {
    return { ok: false, error: { code: "VALIDATION", field: input.field, message: input.message } };
  }

  try {
    const { supabase, userId } = await signedInClient();
    if (!userId) return SIGNED_OUT;

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        client_id: clientId,
        title: input.data.title,
        body: input.data.content,
        updated_by: userId,
      })
      .select("id")
      .single();
    if (error || !data) return fromDatabaseError(error ?? { message: "" }, SAVE_FAILED);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    logFailure("addClientCustomSection", error);
    return fail("UNEXPECTED", SAVE_FAILED);
  }
}

/** AC-04, AC-05: renames a section and replaces its text. */
async function updateClientCustomSectionImpl(
  clientId: string,
  sectionId: string,
  title: string,
  content: string,
): Promise<CustomSectionActionResult> {
  if (getDataSourceMode() === "mock") return NOT_AVAILABLE;
  if (!IdSchema.safeParse(clientId).success || !IdSchema.safeParse(sectionId).success) {
    return BAD_ID;
  }
  const input = parseCustomSectionInput({ title, content });
  if (!input.ok) {
    return { ok: false, error: { code: "VALIDATION", field: input.field, message: input.message } };
  }

  try {
    const { supabase, userId } = await signedInClient();
    if (!userId) return SIGNED_OUT;

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        title: input.data.title,
        body: input.data.content,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sectionId)
      .eq("client_id", clientId)
      .select("id");
    if (error) return fromDatabaseError(error, SAVE_FAILED);
    if (data && data.length > 0) return { ok: true, data: undefined };
    return (await stillExists(supabase, clientId, sectionId))
      ? fail("NOT_ALLOWED", SHIFT_ENDED)
      : fail("NOT_FOUND", GONE);
  } catch (error) {
    logFailure("updateClientCustomSection", error);
    return fail("UNEXPECTED", SAVE_FAILED);
  }
}

/** AC-06: removes a section and its text. One someone else already removed counts as removed. */
async function removeClientCustomSectionImpl(
  clientId: string,
  sectionId: string,
): Promise<CustomSectionActionResult> {
  if (getDataSourceMode() === "mock") return NOT_AVAILABLE;
  if (!IdSchema.safeParse(clientId).success || !IdSchema.safeParse(sectionId).success) {
    return BAD_ID;
  }

  try {
    const { supabase, userId } = await signedInClient();
    if (!userId) return SIGNED_OUT;

    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", sectionId)
      .eq("client_id", clientId)
      .select("id");
    if (error) return fromDatabaseError(error, REMOVE_FAILED);
    if (data && data.length > 0) return { ok: true, data: undefined };
    return (await stillExists(supabase, clientId, sectionId))
      ? fail("NOT_ALLOWED", SHIFT_ENDED)
      : { ok: true, data: undefined };
  } catch (error) {
    logFailure("removeClientCustomSection", error);
    return fail("UNEXPECTED", REMOVE_FAILED);
  }
}

export async function addClientCustomSection(
  ...args: Parameters<typeof addClientCustomSectionImpl>
): ReturnType<typeof addClientCustomSectionImpl> {
  const result = await addClientCustomSectionImpl(...args);
  if (result.ok) refreshCachedPages();
  return result;
}

export async function updateClientCustomSection(
  ...args: Parameters<typeof updateClientCustomSectionImpl>
): ReturnType<typeof updateClientCustomSectionImpl> {
  const result = await updateClientCustomSectionImpl(...args);
  if (result.ok) refreshCachedPages();
  return result;
}

export async function removeClientCustomSection(
  ...args: Parameters<typeof removeClientCustomSectionImpl>
): ReturnType<typeof removeClientCustomSectionImpl> {
  const result = await removeClientCustomSectionImpl(...args);
  if (result.ok) refreshCachedPages();
  return result;
}
