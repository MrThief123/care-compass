/**
 * Date formatting, business logic in Australia/Melbourne (CLAUDE.md §7).
 *
 * Formatting is done with `Intl.DateTimeFormat#formatToParts` (not a
 * locale's default joined string) so the exact punctuation-free layout the
 * designs use ("Monday 30 November 2026", "Mon 30 Nov") is guaranteed
 * regardless of ICU/locale formatting changes.
 */
const MELBOURNE_TIME_ZONE = "Australia/Melbourne";

function toDate(input: string | Date): Date {
  return typeof input === "string" ? new Date(input) : input;
}

function partsFor(date: Date, options: Intl.DateTimeFormatOptions): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-AU", { timeZone: MELBOURNE_TIME_ZONE, ...options });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

/** e.g. 2026-11-30 -> "Monday 30 November 2026". */
export function formatLongDate(input: string | Date): string {
  const parts = partsFor(toDate(input), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year}`;
}

/** e.g. 2026-11-30 -> "Mon 30 Nov". */
export function formatShortDate(input: string | Date): string {
  const parts = partsFor(toDate(input), { weekday: "short", day: "numeric", month: "short" });
  return `${parts.weekday} ${parts.day} ${parts.month}`;
}
