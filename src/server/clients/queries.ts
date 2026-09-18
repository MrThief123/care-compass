/**
 * `clients` domain query contract. Authored by F0-15 (the first feature
 * needing client data), following the same data-source-adapter shape as
 * the `budget`/`events` contracts UI-00 authored (ARCHITECTURE.md §3.2).
 * Screens must import from here, never from `src/mocks` directly
 * (lint-enforced).
 */
import * as mock from "@/mocks/queries/clients";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";

export type { ClientHeaderSummary } from "@/mocks/queries/clients";

export async function getClientHeaderSummary(clientId: string): Promise<mock.ClientHeaderSummary> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getClientHeaderSummary(clientId);
  }
  notImplementedForSupabase("clients", "getClientHeaderSummary");
}
