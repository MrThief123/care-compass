/**
 * Formatting for the Family · Budget History: the design's dates ("3 Nov 2026")
 * and signed amounts ("+$6,000"). Local because the shared formatters do not
 * write either (no year, "Sept", cents rounded away, no sign) and `src/lib` is
 * not this feature's to edit (DECISIONS.md FD-04).
 */
import { formatDollars } from "@/features/family-home/home-format";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * "2026-11-03" → "3 Nov 2026". A fund entry's date is a calendar day, not an
 * instant, so it is read from the string and no `Date` is built: no time zone
 * (the Melbourne daylight-saving switch included) can move it. A string that is
 * not a real calendar day comes back unchanged, never "Invalid Date" or a day
 * rolled into the next month.
 */
export function formatFundDate(iso: string): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return iso;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const lastDay = (DAYS_IN_MONTH[month - 1] ?? 0) + (month === 2 && isLeapYear(year) ? 1 : 0);
  if (day < 1 || day > lastDay) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** "+$6,000" for a top-up, "-$320" for an expense, "$0" for nothing (no sign on zero). */
export function formatSignedDollars(amount: number): string {
  const text = formatDollars(Math.abs(amount));
  if (text === "$0") return text;
  return `${amount > 0 ? "+" : "-"}${text}`;
}
