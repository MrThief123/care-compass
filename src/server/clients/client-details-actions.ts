"use server";

/**
 * F0-28 `saveClientDetails`: saves a client's personal details from Family Settings. Validated
 * with the shared schema at the trust boundary (ARCHITECTURE.md §12.4); the result shape is
 * ARCHITECTURE.md §4's. Authority is the database's: `save_client_details` refuses anyone who is
 * not a family member of the client, so this action is not the only lock.
 */
import { z } from "zod";

import { getDataSourceMode } from "@/server/data-source";
import { refreshCachedPages } from "@/server/refresh-cache";

import { saveClientDetailsArgs } from "./client-details-rpc";
import { ClientDetailsInputSchema, type ClientDetails } from "./client-details-schema";

import type { ClientActionResult } from "./actions";

const FAILED = "Couldn't save the details. Try again.";
const INVALID = "Check the highlighted fields.";
const NOT_ALLOWED = "Only the client's family can change these details.";

async function saveClientDetailsImpl(
  clientId: string,
  input: unknown,
): Promise<ClientActionResult> {
  const parsed = ClientDetailsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION", message: INVALID } };
  }
  // Drop the keys a blank field turned into undefined: what is left is what is set.
  const details = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined),
  ) as ClientDetails;

  if (getDataSourceMode() === "mock") {
    const mock = await import("@/mocks/queries/clients");
    return (await mock.saveClientDetails(clientId, details))
      ? { ok: true, data: undefined }
      : { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
  }

  if (!z.guid().safeParse(clientId).success) {
    return { ok: false, error: { code: "VALIDATION", message: FAILED } };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.rpc(
      "save_client_details",
      saveClientDetailsArgs(clientId, details),
    );
    if (!error) return { ok: true, data: undefined };
    // Fixed messages by error code: the database's text may name a client.
    if (error.code === "42501") {
      return { ok: false, error: { code: "NOT_ALLOWED", message: NOT_ALLOWED } };
    }
    if (error.code === "23514") {
      return { ok: false, error: { code: "VALIDATION", message: INVALID } };
    }
    return { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
  } catch (error) {
    // A feature tag and the error's class only (ARCHITECTURE.md §12.5).
    console.error(
      "[clients] saveClientDetails failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
  }
}

export async function saveClientDetails(
  ...args: Parameters<typeof saveClientDetailsImpl>
): ReturnType<typeof saveClientDetailsImpl> {
  const result = await saveClientDetailsImpl(...args);
  if (result.ok) refreshCachedPages();
  return result;
}
