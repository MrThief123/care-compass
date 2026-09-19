/**
 * Where each occurrence of the day sits on the Today timeline, however many
 * there are and however they overlap.
 *
 * The scale is 44px per hour, exactly as the design draws it. Every block is at
 * least `MIN_BLOCK_PX` tall so its title, assignee, duration and status pill
 * fit on one row, and no block is ever drawn over another: when two would
 * touch, the later one is stacked below the earlier one and the hours after it
 * move down with it. That keeps every label in time order and every event in
 * its own hour, at the cost of an uneven scale on a crowded day. An ordinary
 * day is not stretched at all (DECISIONS.md FD-14).
 *
 * Pure, so the arithmetic is tested without rendering anything.
 */
import { melbourneMinutesOfDay } from "@/components/shared/calendar/melbourne-time";
import type { Occurrence } from "@/types/domain";

/** Height of one hour on an unstretched scale (the design's 44px rows). */
export const ROW_PX = 44;
/** The shortest a block is drawn: room for the status pill on one row, plus a little air. */
export const MIN_BLOCK_PX = 36;
/** The hours the timeline opens on when the day has nothing outside them: rows 07:00 to 18:00. */
export const DEFAULT_START_HOUR = 7;
export const DEFAULT_END_HOUR = 19;

const MINUTES_PER_DAY = 24 * 60;
/** How long, in minutes, a block of `MIN_BLOCK_PX` looks on the even scale. */
const MIN_BLOCK_MINUTES = (MIN_BLOCK_PX * 60) / ROW_PX;
/** Anything smaller than this is rounding noise, not a push. */
const EPSILON_PX = 0.01;

export interface TimelineWindow {
  /** First hour with a row (its label is `HH:00`). */
  startHour: number;
  /** The hour the last row ends at, so rows run `startHour` to `endHour - 1`. */
  endHour: number;
}

export interface TimelineBlock {
  occurrence: Occurrence;
  /** Pixels from the top of the canvas. */
  top: number;
  height: number;
  /** Melbourne minutes since midnight. */
  startMinutes: number;
  /** True when the block was moved down to keep it off the block above. */
  pushed: boolean;
}

export interface TimelineHour {
  hour: number;
  top: number;
  /** True when an occurrence starts in this hour. */
  startsEvent: boolean;
}

export interface DayLayout extends TimelineWindow {
  canvasHeight: number;
  /** In time order, which is the order keyboard focus follows. */
  blocks: TimelineBlock[];
  hours: TimelineHour[];
  /** True when the hour scale had to be stretched, or the canvas grown, to fit the day. */
  stretched: boolean;
  /** Pixels for a Melbourne time of day on this layout's scale, or null outside the hours shown. */
  yAt: (minutesOfDay: number) => number | null;
}

function duration(occurrence: Occurrence): number {
  return Number.isFinite(occurrence.durationMinutes) ? Math.max(0, occurrence.durationMinutes) : 0;
}

function compareKeys(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * The hours to show: 07:00 to 19:00 by default, reaching earlier for an event
 * before 07:00 and later for one that runs past 19:00, never past the day's
 * edges. Nothing is hidden below a fold.
 */
export function timelineWindow(occurrences: Occurrence[]): TimelineWindow {
  let startHour: number = DEFAULT_START_HOUR;
  let endHour: number = DEFAULT_END_HOUR;
  for (const occurrence of occurrences) {
    const start = melbourneMinutesOfDay(occurrence.start);
    startHour = Math.min(startHour, Math.floor(start / 60));
    // A short event is drawn at least MIN_BLOCK_PX tall, so it needs that much room.
    const end = start + Math.max(duration(occurrence), MIN_BLOCK_MINUTES);
    endHour = Math.max(endHour, Math.ceil(end / 60));
  }
  return { startHour: Math.max(0, startHour), endHour: Math.min(24, endHour) };
}

export function layoutDay(occurrences: Occurrence[]): DayLayout {
  const { startHour, endHour } = timelineWindow(occurrences);

  // Time order; events that start together longest first, then by key, so the
  // order never depends on the order the contract happened to return.
  const ordered = occurrences
    .map((occurrence) => ({
      occurrence,
      start: melbourneMinutesOfDay(occurrence.start),
      minutes: duration(occurrence),
    }))
    .sort(
      (a, b) =>
        a.start - b.start ||
        b.minutes - a.minutes ||
        compareKeys(a.occurrence.key, b.occurrence.key),
    );

  const blocks: TimelineBlock[] = [];
  const hours: TimelineHour[] = [];
  let rowTop = 0;
  // The bottom of the last block placed: nothing may start above it.
  let cursor = 0;
  let anyPushed = false;
  let next = 0;

  for (let hour = startHour; hour < endHour; hour += 1) {
    let rowBottom = rowTop + ROW_PX;
    let startsEvent = false;

    while (next < ordered.length && Math.floor(ordered[next]!.start / 60) === hour) {
      const { occurrence, start, minutes } = ordered[next]!;
      next += 1;
      startsEvent = true;

      const naturalTop = rowTop + ((start - hour * 60) / 60) * ROW_PX;
      // An event that runs past midnight is drawn to the end of the day.
      const drawnMinutes = Math.min(minutes, MINUTES_PER_DAY - start);
      const height = Math.max(MIN_BLOCK_PX, (drawnMinutes / 60) * ROW_PX);
      const top = Math.max(naturalTop, cursor);
      const pushed = top - naturalTop > EPSILON_PX;

      if (pushed) {
        anyPushed = true;
        // A moved block stays inside its own hour: the hour grows to hold it.
        rowBottom = Math.max(rowBottom, top + height);
      }
      cursor = top + height;
      blocks.push({ occurrence, top, height, startMinutes: start, pushed });
    }

    hours.push({ hour, top: rowTop, startsEvent });
    rowTop = rowBottom;
  }

  const canvasHeight = Math.max(rowTop, cursor);
  const evenHeight = (endHour - startHour) * ROW_PX;

  function yAt(minutesOfDay: number): number | null {
    if (minutesOfDay < startHour * 60 || minutesOfDay > endHour * 60) return null;
    const hour = Math.min(Math.floor(minutesOfDay / 60), endHour - 1);
    const mark = hours[hour - startHour];
    if (!mark) return null;
    const bottom = hours[hour - startHour + 1]?.top ?? rowTop;
    return mark.top + ((minutesOfDay - hour * 60) / 60) * (bottom - mark.top);
  }

  return {
    startHour,
    endHour,
    canvasHeight,
    blocks,
    hours,
    stretched: anyPushed || canvasHeight - evenHeight > EPSILON_PX,
    yAt,
  };
}
