/**
 * Mock (fixture-backed) implementation of the `events` domain contract.
 * Read only by `src/server/events/queries.ts` / `actions.ts` — never
 * imported directly by `src/app` or `src/features`.
 *
 * The rules here (order, `total`, page size, client scoping) are the contract
 * every data source follows; the Phase 3 Supabase implementations must match
 * them (UI-04, CHG-004, CHG-005).
 */
import {
  OCCURRENCES_BY_CLIENT_ID,
  REFERENCE_DATE,
  UPCOMING_OCCURRENCES_BY_CLIENT_ID,
} from "@/mocks/fixtures";
import { melbourneDateKey } from "@/mocks/melbourne-time";
import { TASK_LOG_PAGE_SIZE } from "@/types/domain";
import type { Occurrence, OccurrenceRange, TaskLogQuery, TaskLogResult } from "@/types/domain";

type OccurrencesByClient = Readonly<Record<string, readonly Occurrence[]>>;

/**
 * A client's rows. Own properties only, so a client id such as "constructor"
 * or "__proto__" (it arrives from a URL) is simply an unknown client.
 */
function rowsFor(byClient: OccurrencesByClient, clientId: string): readonly Occurrence[] {
  return Object.hasOwn(byClient, clientId) ? (byClient[clientId] ?? []) : [];
}

/** The instant an occurrence starts. An unparseable start sorts as the oldest possible. */
function startInstant(occurrence: Occurrence): number {
  const instant = Date.parse(occurrence.start);
  return Number.isNaN(instant) ? Number.NEGATIVE_INFINITY : instant;
}

function byKeyAscending(a: Occurrence, b: Occurrence): number {
  if (a.key === b.key) return 0;
  return a.key < b.key ? -1 : 1;
}

/** Newest first by start instant (not by string); ties by key ascending. */
function newestFirst(a: Occurrence, b: Occurrence): number {
  const aStart = startInstant(a);
  const bStart = startInstant(b);
  if (aStart !== bStart) return aStart < bStart ? 1 : -1;
  return byKeyAscending(a, b);
}

/** Oldest first by start instant; ties by key ascending. */
function oldestFirst(a: Occurrence, b: Occurrence): number {
  const aStart = startInstant(a);
  const bStart = startInstant(b);
  if (aStart !== bStart) return aStart < bStart ? -1 : 1;
  return byKeyAscending(a, b);
}

/**
 * The rows that start on the Melbourne calendar day of `referenceIso`, oldest
 * first. Does not reorder the array it is given.
 */
export function occurrencesOnDay(
  occurrences: readonly Occurrence[],
  referenceIso: string,
): Occurrence[] {
  const day = melbourneDateKey(referenceIso);
  return occurrences
    .filter((occurrence) => melbourneDateKey(occurrence.start) === day)
    .sort(oldestFirst);
}

export async function getTodayOccurrences(clientId: string): Promise<Occurrence[]> {
  return occurrencesOnDay(rowsFor(OCCURRENCES_BY_CLIENT_ID, clientId), REFERENCE_DATE);
}

/**
 * One page of a task log. `query` is already validated (`TaskLogQuerySchema`,
 * done by the contract function): `page` is a positive integer. Filters first,
 * then orders newest first, then slices; `total` is the count after filtering.
 * Does not reorder the array it is given.
 */
export function queryTaskLog(
  occurrences: readonly Occurrence[],
  query: TaskLogQuery = {},
): TaskLogResult {
  const { q, status, page = 1 } = query;
  const needle = q?.trim().toLowerCase();

  const matching = occurrences
    .filter((occurrence) => {
      const matchesStatus = !status || occurrence.status === status;
      const matchesQuery = !needle || occurrence.title.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    })
    .sort(newestFirst);

  const offset = (page - 1) * TASK_LOG_PAGE_SIZE;
  return {
    items: matching.slice(offset, offset + TASK_LOG_PAGE_SIZE),
    page,
    pageSize: TASK_LOG_PAGE_SIZE,
    total: matching.length,
  };
}

export async function getTaskLog(
  clientId: string,
  query: TaskLogQuery = {},
): Promise<TaskLogResult> {
  return queryTaskLog(rowsFor(OCCURRENCES_BY_CLIENT_ID, clientId), query);
}

/**
 * One occurrence of the given client's own rows, or `undefined`. Looks only
 * inside `byClient[clientId]`, so another client's key can never match.
 */
export function findOccurrence(
  byClient: OccurrencesByClient,
  clientId: string,
  key: string,
): Occurrence | undefined {
  return rowsFor(byClient, clientId).find((occurrence) => occurrence.key === key);
}

export async function getOccurrence(
  clientId: string,
  key: string,
): Promise<Occurrence | undefined> {
  return (
    findOccurrence(OCCURRENCES_BY_CLIENT_ID, clientId, key) ??
    findOccurrence(UPCOMING_OCCURRENCES_BY_CLIENT_ID, clientId, key)
  );
}

/** The mock's "today": the reference day, as a Melbourne calendar date (CHG-006). */
export async function getToday(): Promise<string> {
  return melbourneDateKey(REFERENCE_DATE);
}

/**
 * The rows whose start falls on a Melbourne calendar day from `range.from` to
 * `range.to`, both inclusive, oldest first (ties by key ascending). `range` is
 * already validated (`OccurrenceRangeSchema`). Returns copies, and does not
 * reorder the array it is given.
 */
export function occurrencesInRange(
  occurrences: readonly Occurrence[],
  range: OccurrenceRange,
): Occurrence[] {
  return occurrences
    .filter((occurrence) => {
      const day = melbourneDateKey(occurrence.start);
      return day >= range.from && day <= range.to;
    })
    .sort(oldestFirst)
    .map((occurrence) => ({ ...occurrence }));
}

export async function getOccurrences(
  clientId: string,
  range: OccurrenceRange,
): Promise<Occurrence[]> {
  return occurrencesInRange(
    [
      ...rowsFor(OCCURRENCES_BY_CLIENT_ID, clientId),
      ...rowsFor(UPCOMING_OCCURRENCES_BY_CLIENT_ID, clientId),
    ],
    range,
  );
}

export interface SetOccurrenceDoneResult {
  ok: true;
  occurrence: Occurrence;
}

/**
 * PD-044 (Manual completion mode): marks an occurrence Done, recording the
 * actor's name (safeguarding requirement, REQ-19). This is a Phase 1 mock
 * mutation over an in-memory copy of the fixture — it does not persist
 * across requests; real persistence lands with the `events` Phase 3
 * wiring feature (F0-11) via the `set_occurrence_done` RPC
 * (ARCHITECTURE.md §4).
 */
export async function setOccurrenceDone(
  key: string,
  actor: string,
): Promise<SetOccurrenceDoneResult> {
  for (const occurrences of Object.values(OCCURRENCES_BY_CLIENT_ID)) {
    const occurrence = occurrences.find((item) => item.key === key);
    if (occurrence) {
      occurrence.status = "done";
      occurrence.actor = actor;
      occurrence.completedAt = REFERENCE_DATE;
      return { ok: true, occurrence };
    }
  }
  throw new Error(`setOccurrenceDone: no occurrence found for key "${key}".`);
}
