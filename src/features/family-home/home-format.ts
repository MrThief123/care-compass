/**
 * Formatting for the Family · Home screen: short dates and dollar amounts.
 *
 * Local because the shared formatters fall short for real data: `formatShortDate`
 * writes September as "Sept" (the en-AU locale's abbreviation), and
 * `formatMoney` rounds to whole dollars, which drops the cents of a
 * `numeric(12,2)` amount (CLAUDE.md §7). Both live in `src/lib`, which this
 * feature does not edit (DECISIONS.md FD-13).
 */
const MELBOURNE_TIME_ZONE = "Australia/Melbourne";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DATE_PARTS = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "numeric",
});

/**
 * "Mon 30 Nov" in Melbourne time, for an ISO instant or a Date. The weekday and
 * month are cut to three letters here, not taken from the locale's short forms,
 * so no month or weekday is ever longer than its neighbours ("Sept", "Tues").
 */
export function shortDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const parts = Object.fromEntries(DATE_PARTS.formatToParts(date).map((p) => [p.type, p.value]));
  const month = MONTHS[Number(parts.month) - 1] ?? "";
  return `${(parts.weekday ?? "").slice(0, 3)} ${parts.day} ${month}`;
}

/**
 * A dollar amount as the design writes it: whole dollars when there are no
 * cents ("$14,880"), cents whenever there are ("$1,234,567.89"). Works in whole
 * cents so floating-point sums ("$0.30", not "$0.30000000000000004") and
 * amounts that round to a whole dollar behave. The minus sign comes before the
 * dollar sign, and a negative that rounds to nothing is "$0", never "-$0".
 */
export function formatDollars(amount: number): string {
  const cents = Math.round(Math.abs(amount) * 100);
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  const sign = amount < 0 && cents > 0 ? "-" : "";
  const fraction = remainder === 0 ? "" : `.${String(remainder).padStart(2, "0")}`;
  return `${sign}$${dollars.toLocaleString("en-AU")}${fraction}`;
}
