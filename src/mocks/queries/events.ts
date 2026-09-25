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
  CARE_EVENTS,
  OCCURRENCES_BY_CLIENT_ID,
  PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID,
  REFERENCE_DATE,
  UPCOMING_OCCURRENCES_BY_CLIENT_ID,
} from "@/mocks/fixtures";
import { melbourneDateKey } from "@/mocks/melbourne-time";
import { isPlainEvent, TASK_LOG_PAGE_SIZE } from "@/types/domain";
import type {
  AnyOccurrence,
  CareEvent,
  Occurrence,
  OccurrenceRange,
  OccurrenceTypeFilter,
  TaskLogResult,
  TypedTaskLogQuery,
} from "@/types/domain";

type OccurrencesByClient<T extends AnyOccurrence = Occurrence> = Readonly<
  Record<string, readonly T[]>
>;

/** Options for the reads that can include plain events (UI-05, FD-01). */
export interface OccurrenceTypeOptions {
  type?: OccurrenceTypeFilter;
}

/**
 * A client's rows. Own properties only, so a client id such as "constructor"
 * or "__proto__" (it arrives from a URL) is simply an unknown client.
 */
function rowsFor<T extends AnyOccurrence>(
  byClient: OccurrencesByClient<T>,
  clientId: string,
): readonly T[] {
  return Object.hasOwn(byClient, clientId) ? (byClient[clientId] ?? []) : [];
}

/**
 * A client's tasks and plain events for a `type` filter. Omitted or `tasks`
 * gives the task rows only, exactly as before UI-05 (FD-01).
 */
function rowsOfType(clientId: string, type: OccurrenceTypeFilter | undefined): AnyOccurrence[] {
  const tasks = type === "events" ? [] : rowsFor(OCCURRENCES_BY_CLIENT_ID, clientId);
  const events =
    type === "all" || type === "events"
      ? rowsFor(PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID, clientId)
      : [];
  return [...tasks, ...events];
}

/** Whether a row passes a `type` filter; omitted means tasks only (FD-01). */
function matchesType(occurrence: AnyOccurrence, type: OccurrenceTypeFilter | undefined): boolean {
  if (type === "all") return true;
  return type === "events" ? isPlainEvent(occurrence) : !isPlainEvent(occurrence);
}

/** The instant an occurrence starts. An unparseable start sorts as the oldest possible. */
function startInstant(occurrence: AnyOccurrence): number {
  const instant = Date.parse(occurrence.start);
  return Number.isNaN(instant) ? Number.NEGATIVE_INFINITY : instant;
}

function byKeyAscending(a: AnyOccurrence, b: AnyOccurrence): number {
  if (a.key === b.key) return 0;
  return a.key < b.key ? -1 : 1;
}

/** Newest first by start instant (not by string); ties by key ascending. */
function newestFirst(a: AnyOccurrence, b: AnyOccurrence): number {
  const aStart = startInstant(a);
  const bStart = startInstant(b);
  if (aStart !== bStart) return aStart < bStart ? 1 : -1;
  return byKeyAscending(a, b);
}

/** Oldest first by start instant; ties by key ascending. */
function oldestFirst(a: AnyOccurrence, b: AnyOccurrence): number {
  const aStart = startInstant(a);
  const bStart = startInstant(b);
  if (aStart !== bStart) return aStart < bStart ? -1 : 1;
  return byKeyAscending(a, b);
}

/**
 * The rows that start on the Melbourne calendar day of `referenceIso`, oldest
 * first. Does not reorder the array it is given.
 */
export function occurrencesOnDay<T extends AnyOccurrence>(
  occurrences: readonly T[],
  referenceIso: string,
): T[] {
  const day = melbourneDateKey(referenceIso);
  return occurrences
    .filter((occurrence) => melbourneDateKey(occurrence.start) === day)
    .sort(oldestFirst);
}

export async function getTodayOccurrences(
  clientId: string,
  options: OccurrenceTypeOptions = {},
): Promise<AnyOccurrence[]> {
  return occurrencesOnDay(rowsOfType(clientId, options.type), REFERENCE_DATE);
}

/**
 * One page of a task log. `query` is already validated (`TaskLogQuerySchema`,
 * done by the contract function): `page` is a positive integer. Filters first,
 * then orders newest first, then slices; `total` is the count after filtering.
 * `type` omitted keeps tasks only (FD-01); a `status` filter keeps tasks only,
 * since a plain event has no status. Does not reorder the array it is given.
 */
export function queryTaskLog<T extends AnyOccurrence>(
  occurrences: readonly T[],
  query: TypedTaskLogQuery = {},
): TaskLogResult<T> {
  const { q, status, type, page = 1 } = query;
  const needle = q?.trim().toLowerCase();

  const matching = occurrences
    .filter((occurrence) => {
      const matchesStatus = !status || (!isPlainEvent(occurrence) && occurrence.status === status);
      if (!matchesType(occurrence, type)) return false;
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
  query: TypedTaskLogQuery = {},
): Promise<TaskLogResult<AnyOccurrence>> {
  return queryTaskLog(rowsOfType(clientId, query.type), query);
}

/**
 * One occurrence of the given client's own rows, or `undefined`. Looks only
 * inside `byClient[clientId]`, so another client's key can never match.
 */
export function findOccurrence<T extends AnyOccurrence>(
  byClient: OccurrencesByClient<T>,
  clientId: string,
  key: string,
): T | undefined {
  return rowsFor(byClient, clientId).find((occurrence) => occurrence.key === key);
}

/**
 * With no `type` (or `tasks`), only task rows are searched, as before UI-05;
 * `all` or `events` also finds plain events (FD-03).
 */
export async function getOccurrence(
  clientId: string,
  key: string,
  options: OccurrenceTypeOptions = {},
): Promise<AnyOccurrence | undefined> {
  const found = rowsOfType(clientId, options.type).find((occurrence) => occurrence.key === key);
  if (found || options.type === "events") return found;
  // Upcoming rows are tasks, outside every Task log (CHG-012).
  return findOccurrence(UPCOMING_OCCURRENCES_BY_CLIENT_ID, clientId, key);
}

/**
 * One care event (the series, not an occurrence) of the given client, or
 * `undefined`. Matches on both ids, so another client's event never returns
 * (CHG-008).
 */
export async function getEvent(clientId: string, eventId: string): Promise<CareEvent | undefined> {
  return CARE_EVENTS.find((event) => event.id === eventId && event.clientId === clientId);
}

/** The mock's "today": the reference day, as a Melbourne calendar date (CHG-012). */
export async function getToday(): Promise<string> {
  return melbourneDateKey(REFERENCE_DATE);
}

/**
 * The rows whose start falls on a Melbourne calendar day from `range.from` to
 * `range.to`, both inclusive, oldest first (ties by key ascending). `range` is
 * already validated (`OccurrenceRangeSchema`). Returns copies, and does not
 * reorder the array it is given.
 */
export function occurrencesInRange<T extends AnyOccurrence>(
  occurrences: readonly T[],
  range: OccurrenceRange,
): T[] {
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
  options: OccurrenceTypeOptions = {},
): Promise<AnyOccurrence[]> {
  // Tasks, as before; plain events join only when the read asks for them (F0-11, UI-05 FD-01).
  const tasks =
    options.type === "events"
      ? []
      : [
          ...rowsFor(OCCURRENCES_BY_CLIENT_ID, clientId),
          ...rowsFor(UPCOMING_OCCURRENCES_BY_CLIENT_ID, clientId),
        ];
  const events =
    options.type === "all" || options.type === "events"
      ? rowsFor(PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID, clientId)
      : [];
  return occurrencesInRange<AnyOccurrence>([...tasks, ...events], range);
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
