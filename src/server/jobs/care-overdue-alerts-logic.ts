import { isPlainEvent, type AnyOccurrence, type Occurrence } from "@/types/domain";

/**
 * INT-09 (PD-062): the pure rules of the overdue care alert, with no database and no clock (`now`
 * is passed in), so every time rule is exact and testable. The job that uses them is
 * `care-overdue-alerts.ts`.
 */

/** An occurrence qualifies once it is this many minutes past its due time (its start). */
export const OVERDUE_GRACE_MINUTES = 30;

/** Only occurrences due within this many hours are alerted, so a first run never floods anyone. */
export const ALERT_WINDOW_HOURS = 48;

/** The most occurrences alerted in one run; the rest go on the next (FD-04). */
export const MAX_ALERTS_PER_RUN = 100;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * The task occurrences to alert: overdue (not done, not a plain event), at least
 * OVERDUE_GRACE_MINUTES past due and no more than ALERT_WINDOW_HOURS ago, oldest due first so a
 * capped run clears the longest wait first. Cancelled occurrences never reach here: the occurrence
 * builder leaves them out.
 */
export function selectAlertable(occurrences: readonly AnyOccurrence[], now: Date): Occurrence[] {
  const latestDue = now.getTime() - OVERDUE_GRACE_MINUTES * MINUTE_MS;
  const earliestDue = now.getTime() - ALERT_WINDOW_HOURS * HOUR_MS;
  return occurrences
    .filter((occurrence): occurrence is Occurrence => !isPlainEvent(occurrence))
    .filter((occurrence) => occurrence.status === "overdue")
    .filter((occurrence) => {
      const due = Date.parse(occurrence.start);
      return due <= latestDue && due >= earliestDue;
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

/**
 * An occurrence's identity is its key, `${eventId}:${originalStartISO}` (`buildOccurrences`):
 * the event and the start before any override, which is also the tracking row's primary key.
 */
export function occurrenceIdentity(key: string): { eventId: string; originalStart: string } {
  const split = key.indexOf(":");
  return { eventId: key.slice(0, split), originalStart: key.slice(split + 1) };
}

const MELBOURNE = "Australia/Melbourne";
const TIME = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const DATE = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE,
  day: "numeric",
  month: "long",
});

/** ICU may use a narrow no-break space before "am"/"pm"; an email wants an ordinary space. */
const plain = (text: string) => text.replace(/\s/g, " ");

export const OVERDUE_ALERT_SUBJECT = "Schedule of Care Program — overdue care";

/** FD-03: plain, one task per email, the due time in Australia/Melbourne. */
export function overdueAlertMessage(input: { title: string; clientName: string; start: string }): {
  subject: string;
  text: string;
} {
  const due = new Date(input.start);
  return {
    subject: OVERDUE_ALERT_SUBJECT,
    text: `"${input.title}" for ${input.clientName} was due at ${plain(TIME.format(due))} on ${DATE.format(due)} and has not been marked done. Log in to follow it up.`,
  };
}
