import type { LocalDate, LocalDateTime } from "@/lib/recurrence/types";

/** Business logic timezone (OQ-32 proposed default: Australia/Melbourne). */
export const CARE_COMPASS_TIME_ZONE = "Australia/Melbourne";

const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A wall-clock moment (year/month/day/hour/minute/second), stored using a
 * plain `Date`'s UTC slot purely as a fast, host-timezone-independent
 * container. It never represents a real UTC instant: the recurrence engine
 * only ever adds calendar units to and compares Melbourne local wall-clock
 * values, so no actual timezone conversion happens here at all — which is
 * exactly what keeps a 09:00 rule at 09:00 across a DST change (AC-04) and
 * keeps candidate generation fast enough for AC-08 (500 rules / 6 weeks /
 * under 100ms), see FD-01 in this feature's DECISIONS.md.
 */
export type LocalMoment = Date;

/** Parses a `YYYY-MM-DDTHH:mm[:ss]` local string into a LocalMoment. */
export function parseLocalDateTime(value: LocalDateTime): LocalMoment {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Invalid local datetime: "${value}"`);
  }
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      second ? Number(second) : 0,
    ),
  );
}

/** Parses a `YYYY-MM-DD` local date into a LocalMoment at midnight. */
export function parseLocalDate(value: LocalDate): LocalMoment {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Invalid local date: "${value}"`);
  }
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0));
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/** Formats a LocalMoment back to a `YYYY-MM-DDTHH:mm:ss` local string. */
export function formatLocalDateTime(moment: LocalMoment): LocalDateTime {
  return (
    `${moment.getUTCFullYear()}-${pad(moment.getUTCMonth() + 1)}-${pad(moment.getUTCDate())}` +
    `T${pad(moment.getUTCHours())}:${pad(moment.getUTCMinutes())}:${pad(moment.getUTCSeconds())}`
  );
}

/** Calendar-date-only comparison: true when `moment`'s local day is after `untilDate`'s. */
export function isAfterLocalDate(moment: LocalMoment, untilDate: LocalMoment): boolean {
  const dateKey = Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate());
  const untilKey = Date.UTC(
    untilDate.getUTCFullYear(),
    untilDate.getUTCMonth(),
    untilDate.getUTCDate(),
  );
  return dateKey > untilKey;
}

/** Number of days in `year`/`monthIndex` (0-based month), for month-end clamping. */
export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}
