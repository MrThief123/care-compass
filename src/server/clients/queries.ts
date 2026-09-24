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

export type { ClientHeaderSummary } from "@/mocks/queries/clients";

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
