import { MAX_PAGE, normaliseQuery, type TaskLogParams } from "./task-log-params";

/**
 * Family routes this feature links between (ARCHITECTURE.md §3.1).
 * Occurrence keys are `${eventId}:${originalStartISO}` (ARCHITECTURE.md
 * §6.2), so they contain `:` and `+` and must be URL-encoded in a path.
 *
 * The Task log's URL is its state: `?q=&status=&page=` (CHG-005, shared with
 * Home). A link is only ever built from values that pass validation here, so
 * nothing read from a URL is echoed back as-is.
 */

const STATUSES = new Set(["planned", "done", "overdue"]);

function viewQuery(view: Partial<TaskLogParams> | undefined): string {
  if (!view) return "";
  const search = new URLSearchParams();
  const q = normaliseQuery(view.q ?? "");
  if (q) search.set("q", q);
  if (view.status && STATUSES.has(view.status)) search.set("status", view.status);
  if (typeof view.page === "number" && Number.isInteger(view.page) && view.page > 1) {
    search.set("page", String(Math.min(view.page, MAX_PAGE)));
  }
  return search.toString();
}

function withView(path: string, view: Partial<TaskLogParams> | undefined): string {
  const query = viewQuery(view);
  return query ? `${path}?${query}` : path;
}

/** The Task log for a client; `view` adds the search, Status and page (defaults are left out). */
export function taskLogHref(clientId: string, view?: Partial<TaskLogParams>): string {
  return withView(`/family/${encodeURIComponent(clientId)}/tasks`, view);
}

/** One task's detail; `view` carries the Task log's view so 'Back to Task log' returns to it. */
export function taskDetailHref(
  clientId: string,
  occurrenceKey: string,
  view?: Partial<TaskLogParams>,
): string {
  return withView(
    `/family/${encodeURIComponent(clientId)}/tasks/${encodeURIComponent(occurrenceKey)}`,
    view,
  );
}

/** The Edit link on Task detail goes to the edit-event route for the occurrence's event. */
export function editEventHref(clientId: string, eventId: string): string {
  return `/family/${encodeURIComponent(clientId)}/events/${encodeURIComponent(eventId)}/edit`;
}

/**
 * Route params can arrive encoded or already decoded depending on the
 * runtime. A contract key never contains `%`, so decoding twice is safe;
 * a malformed sequence is returned as given rather than thrown.
 */
export function decodeOccurrenceKey(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
