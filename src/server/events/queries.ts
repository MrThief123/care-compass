/**
 * `events` domain query contract (UI-00 — see feature DECISIONS.md FD-02;
 * extended by UI-04 under CHG-004, per CHG-002 "extend, not recreate").
 * Screens must import from here, never from `src/mocks` directly
 * (lint-enforced).
 */
import * as mock from "@/mocks/queries/events";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import { TaskLogQuerySchema } from "@/types/domain";
import type { Occurrence, OccurrenceStatus, TaskLogResult } from "@/types/domain";

export interface TaskLogQueryInput {
  q?: string;
  status?: OccurrenceStatus;
  page?: number;
}

/**
 * The client's occurrences that start on the reference day (Melbourne
 * calendar day), oldest first, ties by key ascending.
 */
export async function getTodayOccurrences(clientId: string): Promise<Occurrence[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getTodayOccurrences(clientId);
  }
  notImplementedForSupabase("events", "getTodayOccurrences");
}

/**
 * One page of the client's whole task history (CHG-004, CHG-005): nothing is
 * cut off, every page is reachable, and search and status filtering run over
 * all of it, not over one page.
 *
 * - Order: newest first by `start` (compared as instants, not strings); ties
 *   broken by `key` ascending. Deterministic, so pages never overlap or skip.
 * - `total`: the number of rows after the `q` and `status` filters, across all
 *   pages (not the number on this page).
 * - Page size: 20 (`TASK_LOG_PAGE_SIZE`). A page beyond the last returns empty
 *   `items` with the true `total` and the requested `page`; it does not throw.
 * - `q`: trimmed, case-insensitive substring of the task title. `status`:
 *   exact match.
 * - Validation: `query` is parsed with `TaskLogQuerySchema`. `page` of 0, a
 *   negative, a fraction, NaN or Infinity, or an unknown `status`, rejects with
 *   a `ZodError`. Screens sanitise URL params before calling.
 * - An unknown client has an empty log (`total` 0).
 */
export async function getTaskLog(
  clientId: string,
  query: TaskLogQueryInput = {},
): Promise<TaskLogResult> {
  const parsed = TaskLogQuerySchema.parse(query);
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getTaskLog(clientId, parsed);
  }
  notImplementedForSupabase("events", "getTaskLog");
}

/**
 * One occurrence by its key (`${eventId}:${originalStartISO}`), past or future,
 * or `undefined` when the key is unknown or does not belong to `clientId`. It
 * never returns another client's row; authorisation itself stays in RLS.
 */
export async function getOccurrence(
  clientId: string,
  key: string,
): Promise<Occurrence | undefined> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getOccurrence(clientId, key);
  }
  notImplementedForSupabase("events", "getOccurrence");
}
