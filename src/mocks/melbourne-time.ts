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

const WALL_CLOCK_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** The Melbourne calendar day (`YYYY-MM-DD`) of an ISO instant, in whatever offset it is written. */
export function melbourneDateKey(iso: string): string {
  const parts = Object.fromEntries(
    DATE_FORMATTER.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** The Melbourne wall-clock time of an instant, as if it were UTC (milliseconds). */
function wallClockAsUtcMs(instantMs: number): number {
  const parts = Object.fromEntries(
    WALL_CLOCK_FORMATTER.formatToParts(new Date(instantMs)).map((part) => [part.type, part.value]),
  );
  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
}

const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Melbourne is on AEDT (+11:00) in summer and AEST (+10:00) in winter. */
const MELBOURNE_OFFSETS_MINUTES = [660, 600] as const;

/**
 * A Melbourne wall-clock time (`YYYY-MM-DDTHH:mm[:ss]`, the form the
 * recurrence engine emits) as an ISO string with its offset, for example
 * `2026-11-30T09:00` becomes `2026-11-30T09:00:00+11:00`. The offset is the one
 * Melbourne actually has at that moment, so daylight saving is respected.
 * Throws for a malformed value, or a time that does not exist because the
 * clocks jump forward past it. In the hour the clocks go back, where a time
 * happens twice, the earlier (+11:00) reading is returned.
 */
export function localToMelbourneIso(local: string): string {
  const match = LOCAL_DATE_TIME_PATTERN.exec(local);
  if (!match) {
    throw new Error(`Invalid local datetime: "${local}"`);
  }
  const [, year, month, day, hour, minute, second = "00"] = match;
  const wallClockMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  for (const offsetMinutes of MELBOURNE_OFFSETS_MINUTES) {
    if (wallClockAsUtcMs(wallClockMs - offsetMinutes * 60_000) === wallClockMs) {
      const offsetHours = String(Math.floor(offsetMinutes / 60)).padStart(2, "0");
      const offsetRest = String(offsetMinutes % 60).padStart(2, "0");
      return `${year}-${month}-${day}T${hour}:${minute}:${second}+${offsetHours}:${offsetRest}`;
    }
  }
  throw new Error(`"${local}" does not exist in Australia/Melbourne (daylight-saving gap).`);
}
