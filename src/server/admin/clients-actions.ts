"use server";

/**
 * `admin` client Server Actions (ADM-05). Remove is a detach, never a delete (PD-036): the
 * database function `admin_remove_client` clears the organisation and keeps everything the family
 * owns. Result shape per ARCHITECTURE.md §4 — never throw to the client for an expected failure.
 */
import { z } from "zod";

import { ADMIN_CLIENTS } from "@/mocks/admin-clients";
import { isMockClientRemoved, removeMockClient } from "@/server/admin/clients-mock-store";
import { getDataSourceMode } from "@/server/data-source";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: "VALIDATION" | "NOT_FOUND" | "NOT_ALLOWED" | "UNEXPECTED"; message: string };
    };

const ClientIdSchema = z.string().trim().min(1);
const REMOVE_FAILED_MESSAGE = "Couldn't remove this client. Try again.";

export async function removeClient(id: string): Promise<ActionResult<{ id: string }>> {
  const parsed = ClientIdSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION", message: "Choose a client to remove." } };
  }
  const clientId = parsed.data;

  if (getDataSourceMode() === "mock") {
    const known = ADMIN_CLIENTS.clients.some((client) => client.id === clientId);
    if (!known || isMockClientRemoved(clientId)) {
      return { ok: false, error: { code: "NOT_FOUND", message: "That client was not found." } };
    }
    removeMockClient(clientId);
    return { ok: true, data: { id: clientId } };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_client", { p_client_id: clientId });
  if (error) {
    return {
      ok: false,
      error: {
        code: error.code === "42501" ? "NOT_ALLOWED" : "UNEXPECTED",
        message: REMOVE_FAILED_MESSAGE,
      },
    };
  }
  return { ok: true, data: { id: clientId } };
}
