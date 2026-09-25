import type { LocalDate } from "@/lib/dates/week-range";

import type { CalendarParams, CalendarRange } from "./calendar-params";

/**
 * Labels for the Family · Calendar. Local dates (`YYYY-MM-DD`) carry no time,
 * so they are formatted as UTC calendar days and never shift with a timezone;
 * instants are read in Australia/Melbourne (CLAUDE.md §7).
 */
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LONG_DAY = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const LONG_MONTH = new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", month: "long" });

const MELBOURNE_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" });

function parts(date: LocalDate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

function asUtc(date: LocalDate): Date {
  const { year, month, day } = parts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

/** "Tuesday 1 December" (Tasks panel subtitle). */
export function dayHeading(date: LocalDate): string {
  const fields = Object.fromEntries(
    LONG_DAY.formatToParts(asUtc(date)).map((p) => [p.type, p.value]),
  );
  return `${fields.weekday} ${fields.day} ${fields.month}`;
}

/** "30 Nov – 6 Dec 2026"; the first year is written only when the week crosses into a new one. */
export function weekLabel({ from, to }: CalendarRange): string {
  const start = parts(from);
  const end = parts(to);
  const startYear = start.year === end.year ? "" : ` ${start.year}`;
  return `${start.day} ${SHORT_MONTHS[start.month - 1]}${startYear} – ${end.day} ${SHORT_MONTHS[end.month - 1]} ${end.year}`;
}

/** "December 2026". */
export function monthLabel(month: string): string {
  return `${LONG_MONTH.format(asUtc(`${month}-01`))} ${month.slice(0, 4)}`;
}

/** The toolbar heading for the view: a day, a week or a month. */
export function rangeLabel(params: CalendarParams, range: CalendarRange): string {
  if (params.view === "day") return `${dayHeading(params.date)} ${parts(params.date).year}`;
  if (params.view === "month") return monthLabel(params.month);
  return weekLabel(range);
}

/** The Melbourne calendar day (`YYYY-MM-DD`) an ISO instant falls on. */
export function melbourneDay(iso: string): LocalDate {
  return MELBOURNE_DAY.format(new Date(iso));
}
