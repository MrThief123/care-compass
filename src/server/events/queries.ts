/**
 * `events` domain query contract (UI-00 — see feature DECISIONS.md FD-02).
 * Screens must import from here, never from `src/mocks` directly
 * (lint-enforced).
 */
import * as mock from "@/mocks/queries/events";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { Occurrence, OccurrenceStatus, TaskLogResult } from "@/types/domain";

export interface TaskLogQueryInput {
  q?: string;
  status?: OccurrenceStatus;
  page?: number;
}

export async function getTodayOccurrences(clientId: string): Promise<Occurrence[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getTodayOccurrences(clientId);
  }
  notImplementedForSupabase("events", "getTodayOccurrences");
}

export async function getTaskLog(
  clientId: string,
  query: TaskLogQueryInput = {},
): Promise<TaskLogResult> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getTaskLog(clientId, query);
  }
  notImplementedForSupabase("events", "getTaskLog");
}
