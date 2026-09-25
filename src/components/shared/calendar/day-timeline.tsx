"use client";

import { Icon } from "@/components/ui/icon";
import { layoutBlocks } from "@/lib/dates/layout-blocks";
import { cn } from "@/lib/utils";
import { isPlainEvent } from "@/types/domain";
import type { AnyOccurrence, Occurrence } from "@/types/domain";

import { EventPill } from "../event-pill";
import { StatusPill } from "../status-pill";

import {
  BLOCK_CHROME_PX,
  STATUS_ROW_PX,
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

/**
 * `T` is the occurrence type passed in: tasks only by default, or tasks and
 * plain events (`AnyOccurrence`, UI-05) — `onSelect` hands back the same type.
 */
export interface DayTimelineProps<T extends AnyOccurrence = Occurrence> {
  occurrences: T[];
  /** First hour in view when the day opens (default 7 = 07:00). */
  startHour?: number;
  /** Last hour in view when the day opens (default 18 = 18:00). */
  endHour?: number;
  /** First hour of the scrollable canvas (default 0 = 00:00). */
  dayStartHour?: number;
  /** Hour the scrollable canvas ends at (default 24 = midnight). */
  dayEndHour?: number;
  rowPx?: number;
  /** Pins the current-time line (tests); omit to track the real clock. */
  now?: Date | null;
  /** Fired when a block is clicked — the event is being opened for editing. */
  onSelect?: (occurrence: T) => void;
  className?: string;
}

/** Breathing room between a block's card and its column edges, so its border reads. */
const COLUMN_GUTTER_PX = 3;

/**
 * Family Home "Today" day view (UI-01 Scope).
 *
 * One full-width column of the day over the shared hour canvas: the whole day
 * is scrollable but it opens on `startHour`–`endHour`. Blocks are absolutely
 * positioned inside the canvas and sized in percentages off their overlap
 * column, so they reflow with the window rather than sitting at fixed widths.
 * How much text a block shows is decided by its rendered height (see
 * `blockDensity`); whatever a tier drops is shown in the card it raises on
 * hover, because a click on a block opens it for editing (UI-02).
 */
export function DayTimeline<T extends AnyOccurrence = Occurrence>({
  occurrences,
  startHour = 7,
  endHour = 18,
  dayStartHour = 0,
  dayEndHour = 24,
  rowPx = 44,
  now,
  onSelect,
  className,
}: DayTimelineProps<T>) {
  const hover = useEventHover("day-timeline");
  // One clock for the line and the gutter label, so they cannot disagree.
  const clock = useCurrentTime(now);

  const canvasHeight = (dayEndHour - dayStartHour) * rowPx;
  // The canvas starts at the day start, not at the focus hour.
  const blocks = layoutBlocks(occurrences, { startHour: dayStartHour, rowPx });

  return (
    <TimeGridScroller
      className={className}
      dayStartHour={dayStartHour}
      dayEndHour={dayEndHour}
      focusStartHour={startHour}
      focusEndHour={endHour}
      rowPx={rowPx}
      now={clock}
    >
      <CurrentTimeLine
        now={clock}
        dayStartHour={dayStartHour}
        dayEndHour={dayEndHour}
        rowPx={rowPx}
      />
      {blocks.map(({ item, top, height, columnIndex, columnCount }) => {
        // Never let a card hang off the bottom of the canvas: keep its height
        // and pull it up, so a 23:30 event still shows its whole card.
        const blockHeight = Math.min(height, canvasHeight);
        const blockTop = Math.max(0, Math.min(top, canvasHeight - blockHeight));
        const density = blockDensity(blockHeight);
        const columnWidth = 100 / columnCount;
        const { time: startTime } = melbourneDateTime(item.start);
        const timeRange = melbourneTimeRange(item.start, item.durationMinutes);
        const cue = occurrenceCue(item);
        // Everything but the title: the block's own chrome, the time row, and
        // the status row the `full` tier adds. Whatever is left over, the
        // title may wrap into.
        const lines = titleLines(
          blockHeight,
          BLOCK_CHROME_PX + TIME_LINE_PX + (density === "full" ? STATUS_ROW_PX : 0),
        );

        return (
          <button
            key={item.key}
            type="button"
            data-testid={`day-timeline-block-${item.key}`}
            aria-describedby={hover.describedBy(item)}
            onClick={() => onSelect?.(item)}
            {...hover.blockProps(item)}
            style={{
              top: blockTop,
              height: blockHeight,
              left: `calc(${columnIndex * columnWidth}% + ${COLUMN_GUTTER_PX}px)`,
              width: `calc(${columnWidth}% - ${COLUMN_GUTTER_PX * 2}px)`,
            }}
            className="absolute flex @container overflow-hidden rounded-inset border border-border-brand bg-bg-inset text-left hover:bg-bg-brand-pale focus-visible:bg-bg-brand-pale"
          >
            {/* Status reads at every density: colour, backed by a shape and a word. */}
            <span className={cn("w-1 shrink-0", cue.bar)} aria-hidden />
            <span
              className={cn(
                "flex min-w-0 flex-1 flex-col overflow-hidden px-2",
                // A compact block is 22px: its one row is centred in what the
                // border leaves, with no padding to give away.
                density === "compact" ? "justify-center" : "py-1",
              )}
            >
              {/* The `full` tier renders StatusPill or EventPill, which already says it. */}
              {density !== "full" && <span className="sr-only">{cue.label}: </span>}

              {density === "compact" ? (
                <span className="flex min-w-0 items-baseline gap-1.5">
                  {/* Centred, not baselined: a 14px glyph on the text baseline
                      stands taller than 13px text does and would push this
                      row past the height a 22px block has for it. */}
                  {cue.icon && (
                    <Icon
                      name={cue.icon}
                      size={14}
                      className="shrink-0 self-center text-text-secondary"
                    />
                  )}
                  <span
                    data-title-lines={lines}
                    className="min-w-0 truncate text-body-small leading-tight text-text-primary"
                  >
                    {item.title}
                  </span>
                  <span className="shrink-0 text-body-secondary text-text-secondary tabular-nums">
                    {startTime}
                  </span>
                </span>
              ) : (
                <>
                  {/* The only row allowed to lose height. Everything below it
                      is `shrink-0`, so a status pill that renders taller than
                      its reserved height costs the title a line instead of
                      clipping the time range through the middle. */}
                  <span className="flex min-h-0 min-w-0 items-start gap-1.5">
                    {cue.icon && (
                      <Icon
                        name={cue.icon}
                        size={14}
                        className="mt-0.5 shrink-0 text-text-secondary"
                      />
                    )}
                    {/* Wraps whole words onto the lines the block's height
                        affords, then ellipses — never into the time row's
                        space, and never in a column too narrow to hold a
                        word, where fragments read worse than one cut line.
                        One line truncates instead of clamping: `line-clamp-1`
                        leaves no ellipsis when the overflow is a single word. */}
                    <span
                      data-title-lines={lines}
                      className={cn(
                        "min-w-0 text-body-small leading-tight text-text-primary",
                        lines === 1
                          ? "truncate"
                          : cn(titleClampClass(lines), "@max-[5rem]:truncate"),
                      )}
                    >
                      {item.title}
                    </span>
                  </span>
                  <span className="min-w-0 shrink-0 truncate text-body-secondary text-text-secondary tabular-nums">
                    {timeRange}
                  </span>
                </>
              )}

              {density === "full" && (
                <span className="mt-auto flex min-w-0 shrink-0 items-center gap-2 pt-1">
                  {item.assignee && (
                    <span className="min-w-0 truncate text-body-secondary text-text-secondary">
                      {item.assignee}
                    </span>
                  )}
                  {isPlainEvent(item) ? (
                    <EventPill className="shrink-0" />
                  ) : (
                    <StatusPill status={item.status} actorName={item.actor} className="shrink-0" />
                  )}
                </span>
              )}
            </span>
          </button>
        );
      })}

      {hover.hovered && (
        <EventPopover
          occurrence={hover.hovered.occurrence}
          anchor={hover.hovered.anchor}
          onClose={hover.close}
          {...hover.cardProps}
        />
      )}
    </TimeGridScroller>
  );
}
