import { monthGrid } from "@/lib/dates/month-grid";
import { weekRange, type LocalDate } from "@/lib/dates/week-range";

/**
 * The Family · Calendar's URL is its state: `?view=&date=&month=` (FAM-UI-02).
 *
 * - `view`: `day` | `week` | `month`, default `week`.
 * - `date`: the selected day (`YYYY-MM-DD`), default today. The day and week
 *   views are drawn around it, and the Tasks panel lists it.
 * - `month`: the month the month view draws (`YYYY-MM`). It can differ from
 *   the selected date's month because a month grid shows leading and trailing
 *   days. Default: the month holding most of the selected date's week (its
 *   Thursday), so pressing M on 30 Nov – 6 Dec opens December (AC-05).
 *
 * Anything that does not parse falls back to its default; nothing read from
 * the URL is echoed back unchecked (DECISIONS.md FD-03).
 */
export type CalendarView = "day" | "week" | "month";

export interface CalendarParams {
  view: CalendarView;
  date: LocalDate;
  /** `YYYY-MM`. */
  month: string;
}

export interface CalendarRange {
  from: LocalDate;
  to: LocalDate;
}

type SearchParams = Record<string, string | string[] | undefined>;

const VIEWS: readonly CalendarView[] = ["day", "week", "month"];

/** Years a calendar URL may point at; anything else is a typo, not a plan. */
const MIN_YEAR = 1900;
const MAX_YEAR = 2199;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toUtc(date: LocalDate): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

function fromUtc(date: Date): LocalDate {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function parseDate(value: string | undefined): LocalDate | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const year = Number(value.slice(0, 4));
  if (year < MIN_YEAR || year > MAX_YEAR) return undefined;
  // A date that does not exist (30 Feb) comes back as a different one.
  return fromUtc(toUtc(value)) === value ? value : undefined;
}

function parseMonth(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return undefined;
  return parseDate(`${value}-01`) ? value : undefined;
}

export function addDays(date: LocalDate, amount: number): LocalDate {
  const next = toUtc(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return fromUtc(next);
}

function addMonths(month: string, amount: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year!, monthIndex! - 1 + amount, 1));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}`;
}

/** The month holding most of `date`'s Monday–Sunday week: the month of its Thursday. */
export function monthForWeekOf(date: LocalDate): string {
  return addDays(weekRange(date).start, 3).slice(0, 7);
}

function monthGridRange(month: string): CalendarRange {
  const weeks = monthGrid(`${month}-01`);
  const first = weeks[0]![0]!;
  const lastWeek = weeks[weeks.length - 1]!;
  return { from: first.date, to: lastWeek[lastWeek.length - 1]!.date };
}

export function parseCalendarParams(search: SearchParams, today: LocalDate): CalendarParams {
  const rawView = single(search.view);
  const view = VIEWS.find((option) => option === rawView) ?? "week";
  const date = parseDate(single(search.date)) ?? today;
  const month = parseMonth(single(search.month)) ?? monthForWeekOf(date);
  return { view, date, month };
}

/** The days the current view draws, which is also what it reads (`getOccurrences`). */
export function visibleRange({ view, date, month }: CalendarParams): CalendarRange {
  if (view === "day") return { from: date, to: date };
  if (view === "month") return monthGridRange(month);
  const { start, end } = weekRange(date);
  return { from: start, to: end };
}

export function switchView(params: CalendarParams, view: CalendarView): CalendarParams {
  return { view, date: params.date, month: monthForWeekOf(params.date) };
}

/** Previous (-1) or next (1) day, week or month. */
export function stepCalendar(params: CalendarParams, direction: -1 | 1): CalendarParams {
  if (params.view === "month") {
    const month = addMonths(params.month, direction);
    const { from, to } = monthGridRange(month);
    const keep = params.date >= from && params.date <= to;
    return { view: "month", date: keep ? params.date : `${month}-01`, month };
  }
  const date = addDays(params.date, params.view === "day" ? direction : 7 * direction);
  return { view: params.view, date, month: monthForWeekOf(date) };
}

/**
 * Back to today in the same view. The month view opens the month today is in,
 * not the month of its week (FD-12): "today" should land on its own month.
 */
export function goToToday(params: CalendarParams, today: LocalDate): CalendarParams {
  const month = params.view === "month" ? today.slice(0, 7) : monthForWeekOf(today);
  return { view: params.view, date: today, month };
}

/** A new selected day. The month view's grid stays put, even for a leading or trailing day. */
export function selectDate(params: CalendarParams, date: LocalDate): CalendarParams {
  return params.view === "month"
    ? { ...params, date }
    : { ...params, date, month: monthForWeekOf(date) };
}

export function calendarHref(clientId: string, { view, date, month }: CalendarParams): string {
  const search = new URLSearchParams({ view, date });
  if (view === "month") search.set("month", month);
  return `/family/${encodeURIComponent(clientId)}/calendar?${search.toString()}`;
}
