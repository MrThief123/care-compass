/**
 * F0-26: the custom Client Details sections query contract. Kept apart from `queries.ts` so the
 * built-in sections' contract stays as it is. Screens import from here, never from `src/mocks`.
 */
import * as mock from "@/mocks/queries/clients";
import { getDataSourceMode } from "@/server/data-source";
import type { ClientCustomSection } from "@/types/domain";

/**
 * The client's custom sections, oldest first; a section with no text yet has `content: ""`.
 * With `DATA_SOURCE=supabase` RLS decides what is readable: a client the caller may not see
 * gives `[]`. A database error throws a message naming no client.
 */
export async function getClientCustomSections(clientId: string): Promise<ClientCustomSection[]> {
  if (getDataSourceMode() === "mock") {
    return mock.getClientCustomSections(clientId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_custom_info_sections")
    .select("id, client_id, title, body, updated_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });
  // The message names no client (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getClientCustomSections: could not load the sections.");

  return data.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    content: row.body ?? "",
    updatedAt: row.updated_at,
  }));
}
