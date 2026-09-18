/**
 * Monday-start week ranges (UI-01 Scope: `weekRange(date)`).
 *
 * Dates in and out are plain calendar dates (`YYYY-MM-DD`, no time or
 * offset) rather than the recurrence engine's `LocalDateTime`, so this
 * never needs a real timezone conversion — see `@/lib/recurrence/local-time`
 * for the analogous UTC-slot-as-container trick applied to wall-clock
 * datetimes.
 */
export type LocalDate = string;

export interface WeekRange {
  /** Monday of the week, inclusive. */
  start: LocalDate;
  /** Sunday of the week, inclusive. */
  end: LocalDate;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseLocalDate(value: LocalDate): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

function formatLocalDate(date: Date): LocalDate {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The Monday–Sunday week containing `date`. */
export function weekRange(date: LocalDate | Date): WeekRange {
  const anchor = typeof date === "string" ? parseLocalDate(date) : date;
  const daysSinceMonday = (anchor.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  const start = new Date(anchor);
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { start: formatLocalDate(start), end: formatLocalDate(end) };
}
