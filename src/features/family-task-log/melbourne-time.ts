/**
 * Australia/Melbourne wall-clock helpers for the Task log and Task detail
 * (CLAUDE.md §7: business logic in Melbourne time). Local to this feature
 * because `src/lib/format` is not lane F's folder; a candidate to promote
 * into `src/lib/format` in a shared PR (DECISIONS.md FD-09).
 */
const MELBOURNE_TIME_ZONE = "Australia/Melbourne";

const TIME_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const DAY_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function partsOf(formatter: Intl.DateTimeFormat, iso: string): Record<string, string> {
  return Object.fromEntries(
    formatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
}

/** e.g. 2026-11-30T09:14:00+11:00 -> "09:14" (24-hour clock). */
export function formatTimeOfDay(iso: string): string {
  const parts = partsOf(TIME_FORMATTER, iso);
  return `${parts.hour}:${parts.minute}`;
}

/** The Melbourne calendar day of an instant as `YYYY-MM-DD`, sortable as text. */
export function melbourneDateKey(iso: string): string {
  const parts = partsOf(DAY_FORMATTER, iso);
  return `${parts.year}-${parts.month}-${parts.day}`;
}
