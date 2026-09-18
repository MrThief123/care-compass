/**
 * Mock (fixture-backed) implementation of the `events` domain contract.
 * Read only by `src/server/events/queries.ts` / `actions.ts` — never
 * imported directly by `src/app` or `src/features`.
 */
import { OCCURRENCES_BY_CLIENT_ID, REFERENCE_DATE } from "@/mocks/fixtures";
import type { Occurrence, OccurrenceStatus, TaskLogResult } from "@/types/domain";

function occurrencesFor(clientId: string): Occurrence[] {
  return OCCURRENCES_BY_CLIENT_ID[clientId] ?? [];
}

function isSameDay(isoA: string, isoB: string): boolean {
  return isoA.slice(0, 10) === isoB.slice(0, 10);
}

export async function getTodayOccurrences(clientId: string): Promise<Occurrence[]> {
  return occurrencesFor(clientId).filter((occurrence) =>
    isSameDay(occurrence.start, REFERENCE_DATE),
  );
}

export interface TaskLogQueryInput {
  q?: string;
  status?: OccurrenceStatus;
  page?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function getTaskLog(
  clientId: string,
  query: TaskLogQueryInput = {},
): Promise<TaskLogResult> {
  const { q, status, page = 1 } = query;
  const normalisedQuery = q?.trim().toLowerCase();

  const filtered = occurrencesFor(clientId).filter((occurrence) => {
    const matchesStatus = !status || occurrence.status === status;
    const matchesQuery =
      !normalisedQuery || occurrence.title.toLowerCase().includes(normalisedQuery);
    return matchesStatus && matchesQuery;
  });

  const start = (page - 1) * DEFAULT_PAGE_SIZE;
  const items = filtered.slice(start, start + DEFAULT_PAGE_SIZE);

  return { items, page, pageSize: DEFAULT_PAGE_SIZE, total: filtered.length };
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
