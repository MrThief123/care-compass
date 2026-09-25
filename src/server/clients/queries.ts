/**
 * `clients` domain query contract. Authored by F0-15 (the first feature
 * needing client data), following the same data-source-adapter shape as
 * the `budget`/`events` contracts UI-00 authored (ARCHITECTURE.md §3.2).
 * Screens must import from here, never from `src/mocks` directly
 * (lint-enforced).
 */
import * as mock from "@/mocks/queries/clients";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { ClientInfoSection } from "@/types/domain";

export type { ClientHeaderSummary, OrganisationChoice } from "@/mocks/queries/clients";

export async function getClientHeaderSummary(clientId: string): Promise<mock.ClientHeaderSummary> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getClientHeaderSummary(clientId);
  }
  notImplementedForSupabase("clients", "getClientHeaderSummary");
}

/**
 * A client's Description, Habits and Medical history, in that order, as
 * Family · Info draws them (FAM-UI-04, CHG-018). A section that has never been
 * written is left out, so a client with none, or an unknown client, returns
 * `[]`. Read only: saving an edit is a later feature.
 */
export async function getClientInfoSections(clientId: string): Promise<ClientInfoSection[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getClientInfoSections(clientId);
  }
  notImplementedForSupabase("clients", "getClientInfoSections");
}

/**
 * The organisations a family can move the client to (FAM-13): every organisation
 * registered with Care Compass by name, with the client's current one flagged
 * (`isCurrent`, not choosable). Only id and name leave the database. With
 * `DATA_SOURCE=supabase` it calls `list_organisations_for_transfer`, which answers
 * only for a family member of the client; otherwise it throws.
 */
export async function getOrganisationChoices(clientId: string): Promise<mock.OrganisationChoice[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getOrganisationChoices(clientId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_organisations_for_transfer", {
    p_client_id: clientId,
  });
  // The message names no client (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getOrganisationChoices: could not load organisations.");
  return data.map(({ id, name, is_current }) => ({ id, name, isCurrent: is_current }));
}
