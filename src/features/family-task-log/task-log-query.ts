import type { Occurrence, OccurrenceStatus } from "@/types/domain";

import { melbourneDateKey } from "./melbourne-time";

export type StatusFilter = "all" | OccurrenceStatus;

export interface TaskLogFilter {
  query: string;
  status: StatusFilter;
}

/**
 * Client-side search and status filter (PRD Scope: server search comes with
 * the wiring feature, D32). Search matches the task title, like the mock
 * contract's `q`, ignoring case and surrounding spaces.
 */
export function filterTaskLog(items: Occurrence[], { query, status }: TaskLogFilter): Occurrence[] {
  const needle = query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      (needle === "" || item.title.toLowerCase().includes(needle)),
  );
}

/**
 * OQ-31 default: newest first. Ordered by Melbourne day, newest day first;
 * the sort is stable, so rows keep the contract's order within a day
 * (DECISIONS.md FD-06). Returns a new array.
 */
export function sortTaskLog(items: Occurrence[]): Occurrence[] {
  return items
    .map((item) => ({ item, day: melbourneDateKey(item.start) }))
    .sort((a, b) => b.day.localeCompare(a.day))
    .map(({ item }) => item);
}
