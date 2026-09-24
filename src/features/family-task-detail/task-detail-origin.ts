import { z } from "zod";

import {
  calendarHref,
  calendarQuery,
  parseCalendarParams,
  type CalendarParams,
} from "@/features/family-calendar/calendar-params";
import {
  parseTaskLogParams,
  type RawSearchParams,
  type TaskLogParams,
} from "@/features/family-task-log/task-log-params";
import { taskDetailHref, taskLogHref } from "@/features/family-task-log/task-routes";
import type { LocalDate } from "@/lib/dates/week-range";

/**
 * Where Task detail was opened from (CHG-014), so its Back link returns there.
 *
 * A link to Task detail carries `?from=<tasks|calendar|home>` plus that screen's own URL state:
 * the Task log's `q / status / page`, or the Calendar's `view / date / month`. Nothing else.
 * The Back href is rebuilt only from a whitelisted origin name and params re-validated by that
 * screen's own parser, never from a URL or path read from the query, so it can only ever point
 * at one of the three family screens of the same client. An unknown, missing or hostile `from`
 * is the Task log, as before CHG-014. `router.back()` is not used: it breaks on reload, on a
 * shared link and after arriving from outside the app.
 */
export type TaskDetailOrigin =
  | { from: "tasks"; view?: Partial<TaskLogParams> }
  | { from: "calendar"; view: CalendarParams }
  | { from: "home" };

export interface BackLinkTarget {
  label: string;
  href: string;
}

const OriginSchema = z.enum(["tasks", "calendar", "home"]);

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** A link to one task's detail that remembers where it was opened from. */
export function taskDetailHrefFrom(
  clientId: string,
  occurrenceKey: string,
  origin: TaskDetailOrigin,
): string {
  if (origin.from === "tasks") return taskDetailHref(clientId, occurrenceKey, origin.view ?? {});
  const path = taskDetailHref(clientId, occurrenceKey);
  if (origin.from === "home") return `${path}?from=home`;
  return `${path}?from=calendar&${calendarQuery(origin.view)}`;
}

/**
 * Cleans Task detail's raw `searchParams` into its origin. Never throws. `today` is the
 * Calendar's fallback day when its `date` is missing or invalid.
 */
export function parseTaskDetailOrigin(
  raw: RawSearchParams | undefined,
  today: LocalDate,
): TaskDetailOrigin {
  const source = raw ?? {};
  const from = OriginSchema.safeParse(firstValue(source.from));
  if (from.success && from.data === "home") return { from: "home" };
  if (from.success && from.data === "calendar") {
    return { from: "calendar", view: parseCalendarParams(source, today) };
  }
  return { from: "tasks", view: parseTaskLogParams(source) };
}

/**
 * `parseTaskDetailOrigin` for a page: asks for today (a contract read) only when the Calendar
 * is the origin, the one case that needs a fallback day.
 */
export async function resolveTaskDetailOrigin(
  raw: RawSearchParams | undefined,
  getToday: () => Promise<LocalDate>,
): Promise<TaskDetailOrigin> {
  const origin = parseTaskDetailOrigin(raw, "1970-01-01");
  return origin.from === "calendar" ? parseTaskDetailOrigin(raw, await getToday()) : origin;
}

/** Task detail's Back link: its label and where it goes. No origin is the Task log. */
export function backLinkFor(clientId: string, origin?: TaskDetailOrigin): BackLinkTarget {
  switch (origin?.from) {
    case "calendar":
      return { label: "Back to Calendar", href: calendarHref(clientId, origin.view) };
    case "home":
      return { label: "Back to Home", href: `/family/${encodeURIComponent(clientId)}/home` };
    default:
      return { label: "Back to Task log", href: taskLogHref(clientId, origin?.view) };
  }
}
