/**
 * Vertical pixel placement for timed blocks in `DayTimeline`/`WeekGrid`
 * (UI-01 Scope: `positionBlocks(occurrences, {startHour, rowPx})`).
 *
 * Reads each item's wall-clock time in Australia/Melbourne via
 * `Intl.DateTimeFormat` (same approach as `@/lib/format/date.ts`) rather
 * than trusting the ISO string's own UTC offset, so a block still lands on
 * the right row even if a caller passes a `Z`-suffixed instant.
 */
const MELBOURNE_TIME_ZONE = "Australia/Melbourne";

export interface PositionOptions {
  /** Hour the grid's first row represents (default 7 = 07:00). */
  startHour?: number;
  /** Pixel height of one hour row (default 44). */
  rowPx?: number;
}

export interface PositionedBlock<T> {
  item: T;
  /** Distance in px from the top of the grid. */
  top: number;
  /** Block height in px. */
  height: number;
}

function localHourMinute(iso: string): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: MELBOURNE_TIME_ZONE,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return { hour: Number(parts.hour), minute: Number(parts.minute) };
}

export function positionBlocks<T extends { start: string; durationMinutes: number }>(
  occurrences: T[],
  { startHour = 7, rowPx = 44 }: PositionOptions = {},
): PositionedBlock<T>[] {
  return occurrences.map((item) => {
    const { hour, minute } = localHourMinute(item.start);
    return {
      item,
      top: (hour + minute / 60 - startHour) * rowPx,
      height: (item.durationMinutes / 60) * rowPx,
    };
  });
}
