"use client";

import { Icon } from "@/components/ui/icon";
import { layoutBlocks } from "@/lib/dates/layout-blocks";
import type { LocalDate } from "@/lib/dates/week-range";
import { cn } from "@/lib/utils";
import type { AnyOccurrence, Occurrence } from "@/types/domain";

import {
  BLOCK_CHROME_PX,
  DETAIL_LINE_PX,
  TIME_LINE_PX,
  blockDensity,
  titleClampClass,
  titleLines,
} from "./block-density";
import { CurrentTimeLine, useCurrentTime } from "./current-time-line";
import { EventPopover } from "./event-popover";
import { melbourneDateTime, melbourneTimeRange } from "./melbourne-time";
import { occurrenceCue } from "./status-cue";
import { TimeGridScroller } from "./time-grid-scroller";
import { useEventHover } from "./use-event-hover";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/** Horizontal breathing room between a block and its column's edges, in px. */
const BLOCK_GAP_PX = 2;
/** Smallest height a block is rendered at (see `layoutBlocks`). */
const MIN_BLOCK_PX = 22;

/**
 * `T` is the occurrence type passed in: tasks only by default, or tasks and
 * plain events (`AnyOccurrence`, UI-05) — the callbacks get the same type.
 */
export interface WeekGridProps<T extends AnyOccurrence = Occurrence> {
  /** Monday of the visible week. */
  weekStart: LocalDate;
  occurrences: T[];
  today?: LocalDate;
  /** Overrides the default block title (e.g. carer "Margaret — Morning m…"). */
  labelFormat?: (occurrence: T) => string;
  /** First hour shown when the grid opens (default 7 = 07:00). */
  startHour?: number;
  /** Last hour shown when the grid opens (default 18 = 18:00). */
  endHour?: number;
  /** First hour of the scrollable canvas (default 0 = 00:00). */
  dayStartHour?: number;
  /** Hour the canvas ends at (default 24 = 23:59). */
  dayEndHour?: number;
  rowPx?: number;
  /** Pins the current-time line (tests); omit to track the real clock. */
  now?: Date | null;
  onSelectDay?: (date: LocalDate) => void;
  /** Fired when a block is clicked — the event is being opened for editing. */
  onSelectOccurrence?: (occurrence: T) => void;
  className?: string;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function addDays(date: LocalDate, amount: number): LocalDate {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, day! + amount));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

/** Percentages are used for column placement so the day columns stay fluid. */
function percent(value: number): string {
  return `${Math.round(value * 1e4) / 1e4}%`;
}

/**
 * MON–SUN week grid (UI-01 Scope).
 *
 * Seven fluid day columns over the shared full-day hour canvas
 * (`TimeGridScroller`): the whole day is scrollable but the view opens on
 * `startHour`–`endHour`. Events overlapping inside one day sit side by side
 * (`layoutBlocks`), every block is at least `MIN_BLOCK_PX` tall, and each one
 * renders only the detail its height affords (`blockDensity`) — the rest is in
 * the card it raises on hover, because a click opens the event for editing.
 */
export function WeekGrid<T extends AnyOccurrence = Occurrence>({
  weekStart,
  occurrences,
  today,
  labelFormat,
  startHour = 7,
  endHour = 18,
  dayStartHour = 0,
  dayEndHour = 24,
  rowPx = 44,
  now,
  onSelectDay,
  onSelectOccurrence,
  className,
}: WeekGridProps<T>) {
  const hover = useEventHover("week-grid");
  // One clock for the line and the gutter label, so they cannot disagree.
  const clock = useCurrentTime(now);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const canvasHeight = (dayEndHour - dayStartHour) * rowPx;

  const occurrencesByDay = new Map<LocalDate, T[]>();
  for (const day of days) occurrencesByDay.set(day, []);
  for (const occurrence of occurrences) {
    const { date } = melbourneDateTime(occurrence.start);
    occurrencesByDay.get(date)?.push(occurrence);
  }

  const header = (
    <div className="grid grid-cols-7 border-b border-border-default">
      {days.map((day, index) => {
        const isToday = day === today;
        const dayNumber = Number(day.split("-")[2]);
        return (
          <button
            key={day}
            type="button"
            data-testid={`week-grid-header-${day}`}
            aria-current={isToday ? "date" : undefined}
            onClick={() => onSelectDay?.(day)}
            className={cn(
              // py-3 keeps the day header a 44px-high touch target (UI-§5.1).
              "flex min-w-0 items-baseline justify-center gap-1.5 border-l border-border-default px-2 py-3",
              isToday && "bg-bg-inset/60",
            )}
          >
            <span
              className={cn("text-label-caps", isToday ? "text-text-brand" : "text-text-secondary")}
            >
              {DAY_LABELS[index]}
            </span>
            <span
              className={cn(
                "text-body-emphasis",
                isToday ? "text-text-brand" : "text-text-primary",
              )}
            >
              {dayNumber}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <TimeGridScroller
        dayStartHour={dayStartHour}
        dayEndHour={dayEndHour}
        focusStartHour={startHour}
        focusEndHour={endHour}
        rowPx={rowPx}
        now={clock}
        header={header}
        className={className}
      >
        <div className="absolute inset-0 grid grid-cols-7">
          {days.map((day) => {
            const isToday = day === today;
            const blocks = layoutBlocks(occurrencesByDay.get(day) ?? [], {
              startHour: dayStartHour,
              rowPx,
              minHeightPx: MIN_BLOCK_PX,
            });

            return (
              <div
                key={day}
                data-testid={`week-grid-day-${day}`}
                className={cn(
                  "relative min-w-0 border-l border-border-default",
                  isToday && "bg-bg-inset/60",
                )}
              >
                {/* The line marks only the column it belongs to. */}
                <CurrentTimeLine
                  now={clock}
                  dayStartHour={dayStartHour}
                  dayEndHour={dayEndHour}
                  rowPx={rowPx}
                  onDate={day}
                />

                {blocks.map(({ item, top, height, columnIndex, columnCount }) => {
                  const clampedTop = Math.max(0, Math.min(top, canvasHeight - MIN_BLOCK_PX));
                  const clampedHeight = Math.max(0, Math.min(height, canvasHeight - clampedTop));
                  const density = blockDensity(clampedHeight);
                  const label = labelFormat ? labelFormat(item) : item.title;
                  const { time } = melbourneDateTime(item.start);
                  const cue = occurrenceCue(item);
                  // Everything but the title: the block's own chrome, the time
                  // row, and the assignee line the `full` tier adds when there
                  // is one.
                  const lines = titleLines(
                    clampedHeight,
                    BLOCK_CHROME_PX +
                      TIME_LINE_PX +
                      (density === "full" && item.assignee ? DETAIL_LINE_PX : 0),
                  );

                  return (
                    <button
                      key={item.key}
                      type="button"
                      data-testid={`week-grid-block-${item.key}`}
                      data-density={density}
                      aria-describedby={hover.describedBy(item)}
                      onClick={() => onSelectOccurrence?.(item)}
                      {...hover.blockProps(item)}
                      style={{
                        top: clampedTop,
                        height: clampedHeight,
                        left: `calc(${percent((columnIndex / columnCount) * 100)} + ${BLOCK_GAP_PX}px)`,
                        width: `calc(${percent(100 / columnCount)} - ${BLOCK_GAP_PX * 2}px)`,
                      }}
                      className="absolute flex @container overflow-hidden rounded-inset border border-border-default bg-bg-surface text-left transition-colors hover:border-border-brand"
                    >
                      {/* Status reads at every density: colour, backed by a shape and a word. */}
                      <span className={cn("w-1 shrink-0", cue.bar)} aria-hidden />
                      <span
                        className={cn(
                          "flex min-w-0 flex-1 flex-col overflow-hidden px-2",
                          // A compact block is 22px: its one row is centred in
                          // what the border leaves, with no padding to spare.
                          density === "compact" ? "justify-center" : "py-1",
                        )}
                      >
                        <span className="sr-only">{cue.label}: </span>
                        {density === "compact" ? (
                          <span className="flex min-w-0 items-baseline gap-1.5">
                            {/* Centred, not baselined: a 14px glyph on the
                                text baseline stands taller than the text does
                                and would push this row past the height a 22px
                                block has for it. */}
                            {cue.icon ? (
                              <Icon
                                name={cue.icon}
                                size={14}
                                className="shrink-0 self-center text-text-secondary"
                              />
                            ) : null}
                            <span
                              data-title-lines={lines}
                              className="truncate text-body-secondary text-text-primary"
                            >
                              {label}
                            </span>
                            {/* In a narrow overlap column the title matters
                                more than the time, which the popover repeats. */}
                            <span className="hidden shrink-0 text-body-secondary text-text-secondary tabular-nums @[8rem]:inline">
                              {time}
                            </span>
                          </span>
                        ) : (
                          <>
                            {/* The only row allowed to lose height: the rows
                                below it hold theirs, so a detail line that
                                renders taller than its reserved height costs
                                the title a line instead of clipping the time
                                range through the middle. */}
                            <span className="flex min-h-0 min-w-0 items-start gap-1.5">
                              {cue.icon ? (
                                <Icon
                                  name={cue.icon}
                                  size={14}
                                  className="mt-0.5 shrink-0 text-text-secondary"
                                />
                              ) : null}
                              {/* Whole words only, and only in a column wide
                                  enough to hold one — a narrow overlap column
                                  wrapping "Occupational therapy" gives
                                  "Occup / the…", which reads worse than one
                                  truncated line. */}
                              <span
                                data-title-lines={lines}
                                className={cn(
                                  "min-w-0 text-body-small leading-tight text-text-primary",
                                  lines === 1
                                    ? "truncate"
                                    : cn(titleClampClass(lines), "@max-[5rem]:truncate"),
                                )}
                              >
                                {label}
                              </span>
                            </span>
                            <span className="shrink-0 truncate text-body-secondary text-text-secondary tabular-nums">
                              {melbourneTimeRange(item.start, item.durationMinutes)}
                            </span>
                            {density === "full" && item.assignee ? (
                              <span className="shrink-0 truncate text-body-secondary text-text-secondary">
                                {item.assignee}
                              </span>
                            ) : null}
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </TimeGridScroller>

      {hover.hovered ? (
        <EventPopover
          occurrence={hover.hovered.occurrence}
          anchor={hover.hovered.anchor}
          onClose={hover.close}
          {...hover.cardProps}
        />
      ) : null}
    </>
  );
}
