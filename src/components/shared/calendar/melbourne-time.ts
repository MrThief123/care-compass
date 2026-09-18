/**
 * Shared Melbourne wall-clock extraction for the calendar kit components
 * (DayTimeline, WeekGrid). Same `Intl.DateTimeFormat` approach as
 * `@/lib/dates/position-blocks` and `@/lib/format/date.ts`, kept local to
 * this folder since only these components need the date *and* time parts
 * together.
 */
const MELBOURNE_TIME_ZONE = "Australia/Melbourne";

const FORMATTER = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export interface MelbourneDateTime {
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:mm` */
  time: string;
}

export function melbourneDateTime(iso: string): MelbourneDateTime {
  const parts = Object.fromEntries(
    FORMATTER.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}
