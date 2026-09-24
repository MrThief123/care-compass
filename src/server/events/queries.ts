/**
 * `events` domain query contract (UI-00 — see feature DECISIONS.md FD-02;
 * extended by UI-04 under CHG-004, per CHG-002 "extend, not recreate").
 * Screens must import from here, never from `src/mocks` directly
 * (lint-enforced).
 */
import * as mock from "@/mocks/queries/events";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import { OccurrenceTypeFilterSchema, TaskLogQuerySchema } from "@/types/domain";
import type {
  AnyOccurrence,
  Occurrence,
  OccurrenceStatus,
  OccurrenceTypeFilter,
  TaskLogResult,
} from "@/types/domain";

export interface TaskLogQueryInput {
  q?: string;
  status?: OccurrenceStatus;
  page?: number;
}

/**
 * Asks a read to include plain events (UI-05, CHG-009): `all` gives tasks and
 * plain events, `tasks` only tasks, `events` only plain events. A read with
 * this option returns `AnyOccurrence`; check `isPlainEvent()` before reading a
 * status. Without it, a read returns tasks only, typed `Occurrence`, exactly
 * as before (FD-01, FD-03).
 */
export interface OccurrenceTypeOption {
  type: OccurrenceTypeFilter;
}

/**
 * The client's occurrences that start on the reference day (Melbourne
 * calendar day), oldest first, ties by key ascending. Tasks only unless a
 * `type` option is passed; a Today timeline that shows plain events passes
 * `{ type: "all" }`.
 */
export async function getTodayOccurrences(clientId: string): Promise<Occurrence[]>;
export async function getTodayOccurrences(
  clientId: string,
  options: OccurrenceTypeOption,
): Promise<AnyOccurrence[]>;
export async function getTodayOccurrences(
  clientId: string,
  options?: OccurrenceTypeOption,
): Promise<AnyOccurrence[]> {
  const type = options ? OccurrenceTypeFilterSchema.parse(options.type) : undefined;
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getTodayOccurrences(clientId, { type });
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
 * - `type` (UI-05, CHG-009): `all` returns tasks and plain events together,
 *   `tasks` only tasks, `events` only plain events; the result is then typed
 *   `TaskLogResult<AnyOccurrence>`. Omitted means **tasks only**, typed
 *   `TaskLogResult`, exactly as before (FD-01). Any `status` filter returns
 *   tasks only, since a plain event has no status.
 * - **The log and every export read with `type: "all"`** (human, FD-01): the
 *   Care log (FAM-UI-07, FAM-14, FAM-15) and any log or data export (PL-06,
 *   PL-08) must show tasks and plain events together. The tasks-only default
 *   exists only so callers written before UI-05 keep their results, and may
 *   later switch to `all`.
 * - Validation: `query` is parsed with `TaskLogQuerySchema`. `page` of 0, a
 *   negative, a fraction, NaN or Infinity, or an unknown `status` or `type`,
 *   rejects with a `ZodError`. Screens sanitise URL params before calling.
 * - An unknown client has an empty log (`total` 0).
 */
export async function getTaskLog(
  clientId: string,
  query?: TaskLogQueryInput & { type?: undefined },
): Promise<TaskLogResult>;
export async function getTaskLog(
  clientId: string,
  query: TaskLogQueryInput & OccurrenceTypeOption,
): Promise<TaskLogResult<AnyOccurrence>>;
export async function getTaskLog(
  clientId: string,
  query: TaskLogQueryInput & Partial<OccurrenceTypeOption> = {},
): Promise<TaskLogResult<AnyOccurrence>> {
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
 * Tasks only unless a `type` option is passed: a plain event's key is found
 * only with `{ type: "all" }` or `{ type: "events" }` (FD-03).
 */
export async function getOccurrence(clientId: string, key: string): Promise<Occurrence | undefined>;
export async function getOccurrence(
  clientId: string,
  key: string,
  options: OccurrenceTypeOption,
): Promise<AnyOccurrence | undefined>;
export async function getOccurrence(
  clientId: string,
  key: string,
  options?: OccurrenceTypeOption,
): Promise<AnyOccurrence | undefined> {
  const type = options ? OccurrenceTypeFilterSchema.parse(options.type) : undefined;
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getOccurrence(clientId, key, { type });
  }
  notImplementedForSupabase("events", "getOccurrence");
}
