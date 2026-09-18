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

/**
 * Minutes since Melbourne midnight, which is what places anything on the hour
 * canvas — the current-time line as much as an event block.
 */
export function melbourneMinutesOfDay(iso: string): number {
  const [hour, minute] = melbourneDateTime(iso).time.split(":").map(Number);
  return hour! * 60 + minute!;
}

/**
 * `HH:mm–HH:mm` Melbourne wall-clock span for an occurrence, as the event
 * blocks and their popover label themselves (e.g. "09:00–09:30"). Uses an en
 * dash, matching the reference calendars.
 */
export function melbourneTimeRange(iso: string, durationMinutes: number): string {
  const { time: start } = melbourneDateTime(iso);
  const end = melbourneDateTime(
    new Date(new Date(iso).getTime() + durationMinutes * 60_000).toISOString(),
  ).time;
  return `${start}–${end}`;
}
