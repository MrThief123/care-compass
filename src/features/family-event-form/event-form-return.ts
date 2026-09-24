import {
  backLinkFor,
  taskDetailHrefFrom,
  taskDetailOriginQuery,
  type TaskDetailOrigin,
} from "@/features/family-task-detail/task-detail-origin";
import { editEventHref } from "@/features/family-task-log/task-routes";

/**
 * Where Add event and Edit event lead back to (CHG-015), the same way Task detail's Back works
 * (CHG-014, `task-detail-origin.ts`). `router.back()` is not used: it breaks on reload, on a
 * shared link and after arriving from outside the app.
 *
 * Task detail's 'Edit event' link carries `?occurrence=<key>` and Task detail's own origin. The
 * Edit event page re-validates both (the key must be one of this event's occurrences, the origin
 * goes through `resolveTaskDetailOrigin`) and passes the result here, so an href is only ever
 * built from whitelisted names and checked values, never from a URL read from the query.
 */

/** Task detail's 'Edit event' link: the occurrence being viewed, plus where Task detail came from. */
export function editEventHrefFrom(
  clientId: string,
  occurrence: { eventId: string; key: string },
  origin?: TaskDetailOrigin,
): string {
  const query = new URLSearchParams({ occurrence: occurrence.key }).toString();
  const from = origin ? `&${taskDetailOriginQuery(origin)}` : "";
  return `${editEventHref(clientId, occurrence.eventId)}?${query}${from}`;
}

/**
 * Save event and Cancel on Edit event: the occurrence's Task detail with its origin kept. With
 * no valid occurrence, the origin screen itself (the Task log when there is no origin).
 */
export function editEventReturnHref(
  clientId: string,
  occurrenceKey: string | undefined,
  origin: TaskDetailOrigin,
): string {
  return occurrenceKey
    ? taskDetailHrefFrom(clientId, occurrenceKey, origin)
    : backLinkFor(clientId, origin).href;
}

/** Save event and Cancel on Add event: Family Home, its only opener. */
export function addEventReturnHref(clientId: string): string {
  return backLinkFor(clientId, { from: "home" }).href;
}
