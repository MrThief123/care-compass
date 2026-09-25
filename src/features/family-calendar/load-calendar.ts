import type { LocalDate } from "@/lib/dates/week-range";
import { getCurrentUser } from "@/server/auth/queries";
import { getOccurrences, getTaskLog, getToday } from "@/server/events/queries";
import type { Occurrence } from "@/types/domain";

import { parseCalendarParams, visibleRange, type CalendarParams } from "./calendar-params";

/** Rows in the Log panel (the design shows three). */
export const LOG_ROWS = 3;

export interface FamilyCalendarData {
  today: LocalDate;
  params: CalendarParams;
  occurrences: Occurrence[];
  log: Occurrence[];
  /** The signed-in person, "First Last", shown on a task they tick (CHG-016). */
  actorName: string;
}

/**
 * The latest things that have happened, newest first (the Task log's order):
 * Done and Overdue rows only, because a Planned one has not happened yet.
 */
export function selectLog(items: Occurrence[]): Occurrence[] {
  return items.filter((occurrence) => occurrence.status !== "planned").slice(0, LOG_ROWS);
}

/**
 * Everything the calendar needs, read only through the `src/server/**`
 * contract (CLAUDE.md §7). A rejected read propagates to the route's
 * `error.tsx`.
 */
export async function loadFamilyCalendar(
  clientId: string,
  search: Record<string, string | string[] | undefined>,
): Promise<FamilyCalendarData> {
  const today = await getToday();
  const params = parseCalendarParams(search, today);
  const [occurrences, taskLog, user] = await Promise.all([
    getOccurrences(clientId, visibleRange(params)),
    getTaskLog(clientId),
    getCurrentUser("family"),
  ]);
  return {
    today,
    params,
    occurrences,
    log: selectLog(taskLog.items),
    actorName: `${user.firstName} ${user.lastName}`,
  };
}
