/**
 * Melbourne wall-clock helpers for the mock layer (UI-04). Business logic is
 * Australia/Melbourne (CLAUDE.md §7); these read and write ISO strings with an
 * explicit offset, which is how the fixtures store instants.
 *
 * Read only by `src/mocks/**` — never imported by `src/app` or `src/features`.
 */
const MELBOURNE_TIME_ZONE = "Australia/Melbourne";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The Melbourne calendar day (`YYYY-MM-DD`) of an ISO instant, in whatever offset it is written. */
export function melbourneDateKey(iso: string): string {
  const parts = Object.fromEntries(
    DATE_FORMATTER.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
