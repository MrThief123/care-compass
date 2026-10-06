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
  SHIFTS,
  STAFF_MEMBERS,
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
  const { page = 1 } = query;
  const matching = matchingTaskLogOccurrences(occurrences, query);
  const offset = (page - 1) * TASK_LOG_PAGE_SIZE;
  return {
    items: matching.slice(offset, offset + TASK_LOG_PAGE_SIZE),
    page,
    pageSize: TASK_LOG_PAGE_SIZE,
    total: matching.length,
  };
}

/** Shared filtering/order semantics; the real indexed reader uses this for exceptional rows. */
export function matchingTaskLogOccurrences<T extends AnyOccurrence>(
  occurrences: readonly T[],
  query: TypedTaskLogQuery = {},
): T[] {
  const { q, status, type } = query;
  const needle = q?.trim().toLowerCase();

  const matching = occurrences
    .filter((occurrence) => {
      const matchesStatus = !status || (!isPlainEvent(occurrence) && occurrence.status === status);
      if (!matchesType(occurrence, type)) return false;
      const matchesQuery = !needle || occurrence.title.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    })
    .sort(newestFirst);

  return matching;
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
 * across requests; real persistence is the `events` Phase 3 wiring feature
 * (FAM-05) via the `set_occurrence_done` RPC (ARCHITECTURE.md §4).
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

export interface SetOccurrenceUndoneResult {
  ok: true;
  occurrence: Occurrence;
}

/**
 * OQ-10: undoes a Done occurrence, matching the client's own optimistic
 * simplification (`apply-ticks.ts`) — it always reads Planned afterwards
 * here, rather than recomputing Overdue, since the mock has no clock-driven
 * derivation to recompute it with. Real persistence: FAM-05, the
 * `set_occurrence_undone` RPC.
 */
export async function setOccurrenceUndone(key: string): Promise<SetOccurrenceUndoneResult> {
  for (const occurrences of Object.values(OCCURRENCES_BY_CLIENT_ID)) {
    const occurrence = occurrences.find((item) => item.key === key);
    if (occurrence) {
      occurrence.status = "planned";
      occurrence.actor = undefined;
      occurrence.completedAt = undefined;
      return { ok: true, occurrence };
    }
  }
  throw new Error(`setOccurrenceUndone: no occurrence found for key "${key}".`);
}

export interface CreateEventInput {
  clientId: string;
  title: string;
  description: string;
  /** ISO instant of the first (anchor) occurrence. */
  startsAt: string;
  durationMinutes: number;
  recurrenceFrequency: CareEvent["recurrenceFrequency"];
  completionMode: CareEvent["completionMode"];
}

/**
 * Phase 1 mock mutation (like `setOccurrenceDone`): adds the event to the
 * in-memory fixture and its first (anchor) occurrence, so it is visible
 * immediately after creating it (FAM-06). Does not persist across requests,
 * and does not generate the rest of a recurring series — the fixtures are
 * static, curated data, not a copy of the recurrence engine; real persistence
 * and full expansion is the Supabase branch (`loadOccurrences`, F0-11).
 */
export async function createEvent(input: CreateEventInput): Promise<string> {
  const id = `event-mock-${Math.random().toString(36).slice(2, 10)}`;
  const event: CareEvent = {
    id,
    clientId: input.clientId,
    title: input.title,
    description: input.description,
    start: input.startsAt,
    durationMinutes: input.durationMinutes,
    recurrenceFrequency: input.recurrenceFrequency,
    completionMode: input.completionMode,
  };
  CARE_EVENTS.push(event);

  const key = `${id}:${input.startsAt}`;
  const base = {
    key,
    eventId: id,
    clientId: input.clientId,
    title: input.title,
    description: input.description,
    start: input.startsAt,
    durationMinutes: input.durationMinutes,
  };

  if (input.completionMode === "manual") {
    (OCCURRENCES_BY_CLIENT_ID[input.clientId] ??= []).push({ ...base, status: "planned" });
  } else {
    (PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID[input.clientId] ??= []).push({ ...base, kind: "event" });
  }
  return id;
}

export interface UpdateEventInput {
  clientId: string;
  eventId: string;
  /** The viewed occurrence's original start (its `key`'s second half) — never the edited value. */
  occurrenceOriginalStart: string;
  title: string;
  description: string;
  startsAt: string;
  durationMinutes: number;
  recurrenceFrequency: CareEvent["recurrenceFrequency"];
  completionMode: CareEvent["completionMode"];
  scope: "occurrence" | "series";
}

/**
 * Phase 1 mock mutation for FAM-07: updates the in-memory event and every
 * pre-baked occurrence row that names it (title/description/duration), since
 * the fixtures are static rows, not expanded from the event at read time
 * (the same limitation `createEvent` documents, FAM-06 DECISIONS.md FD-02).
 * `completionMode` only updates the event record — moving an existing static
 * occurrence row between the task and plain-event arrays is not built (no AC
 * needs it; see FAM-07 DECISIONS.md).
 *
 * `scope: "occurrence"` moves only the viewed occurrence's own `start`.
 * `scope: "series"` moves the event's anchor (and that occurrence's `start`)
 * only when the event has no recurrence — a recurring event's date never
 * moves at series scope, matching the restriction the Supabase branch
 * enforces so neither data source can silently shift occurrence identity.
 */
export async function updateEvent(input: UpdateEventInput): Promise<void> {
  const event = CARE_EVENTS.find(
    (candidate) => candidate.id === input.eventId && candidate.clientId === input.clientId,
  );
  if (!event) throw new Error("That event could not be found.");

  const wasRecurring = event.recurrenceFrequency !== "none";
  if (input.scope === "series" && wasRecurring && input.startsAt !== event.start) {
    throw new Error("To move a date on a recurring event, choose 'This occurrence' instead.");
  }

  event.title = input.title;
  event.description = input.description;
  event.recurrenceFrequency = input.recurrenceFrequency;
  event.completionMode = input.completionMode;
  event.durationMinutes = input.durationMinutes;
  if (input.scope === "series" && !wasRecurring) {
    event.start = input.startsAt;
  }

  const viewedKey = `${input.eventId}:${input.occurrenceOriginalStart}`;
  const rows: AnyOccurrence[] = [
    ...rowsFor(OCCURRENCES_BY_CLIENT_ID, input.clientId),
    ...rowsFor(UPCOMING_OCCURRENCES_BY_CLIENT_ID, input.clientId),
    ...rowsFor(PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID, input.clientId),
  ];
  for (const row of rows) {
    if (row.eventId !== input.eventId) continue;
    row.title = input.title;
    row.description = input.description;
    row.durationMinutes = input.durationMinutes;
    if (row.key === viewedKey && (input.scope === "occurrence" || !wasRecurring)) {
      row.start = input.startsAt;
    }
  }
}

/** A carer's shift for a client, with the carer's full name (`client_shift_carers`). */
export interface ClientShift {
  id: string;
  carerName: string;
  start: string;
  end: string;
}

/** The client's shifts that overlap a Melbourne day from `range.from` to `range.to`, earliest first. */
export async function getClientShifts(
  clientId: string,
  range: OccurrenceRange,
): Promise<ClientShift[]> {
  return SHIFTS.filter(
    (shift) =>
      shift.clientId === clientId &&
      melbourneDateKey(shift.start) <= range.to &&
      melbourneDateKey(shift.end) >= range.from,
  )
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .map((shift) => {
      const carer = STAFF_MEMBERS.find((staff) => staff.id === shift.carerId);
      return {
        id: shift.id,
        carerName: carer ? `${carer.firstName} ${carer.lastName}` : "Unknown",
        start: shift.start,
        end: shift.end,
      };
    });
}
