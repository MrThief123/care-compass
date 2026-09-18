"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { melbourneDateTime, melbourneMinutesOfDay } from "./melbourne-time";

export interface TimeGridScrollerProps {
  /** First hour the grid renders (default 0 = 00:00). */
  dayStartHour?: number;
  /** Hour the grid ends at, exclusive of its own row (default 24 = 23:59). */
  dayEndHour?: number;
  /** Hour scrolled to on mount (default 7). */
  focusStartHour?: number;
  /** Hour at the bottom of the viewport on mount (default 18); sets its height. */
  focusEndHour?: number;
  /** Pixel height of one hour row (default 44 — also the minimum touch target). */
  rowPx?: number;
  /** Width of the hour-label gutter (default 56). */
  gutterPx?: number;
  /**
   * Clock to label in the gutter beside the current-time line. The views pass
   * the same value they give `CurrentTimeLine`, so label and line never
   * disagree by a minute.
   */
  now?: Date | null;
  /** Rendered above the scroll area, indented to line up with the columns. */
  header?: ReactNode;
  /** Column content, positioned inside a `relative` box of the full day's height. */
  children: ReactNode;
  className?: string;
}

/** An hour label's line box (`text-body-secondary`, 12/16). */
const HOUR_LABEL_PX = 16;
/** Half that box — how far a label sits above its own gridline. */
const LABEL_BLEED_PX = HOUR_LABEL_PX / 2;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Where the current time reads in the gutter, or `null` when there is no clock
 * or it falls outside the rendered canvas. Centred on its own minute the same
 * way the hour labels are centred on their gridline.
 */
function nowGutterLabel(
  now: Date | null | undefined,
  dayStartHour: number,
  dayEndHour: number,
  rowPx: number,
): { top: number; text: string } | null {
  if (!now) return null;
  const iso = now.toISOString();
  const hoursIn = melbourneMinutesOfDay(iso) / 60;
  if (hoursIn < dayStartHour || hoursIn > dayEndHour) return null;
  return {
    top: (hoursIn - dayStartHour) * rowPx - LABEL_BLEED_PX,
    text: melbourneDateTime(iso).time,
  };
}

/**
 * The scrolling hour canvas shared by `DayTimeline` and `WeekGrid`.
 *
 * Renders the whole day (00:00–23:59 by default) so any event can be scrolled
 * to, but opens on the hours people actually use (07:00–18:00), which also fix
 * the viewport's height. Hour labels and gridlines are absolutely positioned
 * off the same `rowPx` arithmetic the blocks use, so a block at 09:30 lands
 * exactly halfway between the 09:00 and 10:00 rules.
 */
export function TimeGridScroller({
  dayStartHour = 0,
  dayEndHour = 24,
  focusStartHour = 7,
  focusEndHour = 18,
  rowPx = 44,
  gutterPx = 56,
  now,
  header,
  children,
  className,
}: TimeGridScrollerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  // Hour labels are centred on their gridline, so they bleed half a line above
  // it. Open scrolled that much higher, or the first label is sliced in half.
  const offsetPx = Math.max(0, (focusStartHour - dayStartHour) * rowPx - LABEL_BLEED_PX);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = offsetPx;
  }, [offsetPx]);

  const hours = Array.from({ length: dayEndHour - dayStartHour }, (_, i) => dayStartHour + i);
  const gridHeight = hours.length * rowPx;
  const viewportHeight = (focusEndHour - focusStartHour) * rowPx + LABEL_BLEED_PX;

  const nowLabel = nowGutterLabel(now, dayStartHour, dayEndHour, rowPx);

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      {header ? (
        <div className="flex shrink-0">
          <div className="shrink-0" style={{ width: gutterPx }} aria-hidden />
          <div className="min-w-0 flex-1">{header}</div>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        data-testid="time-grid-viewport"
        className="relative overflow-y-auto overscroll-contain"
        style={{ height: viewportHeight }}
      >
        <div className="flex" style={{ height: gridHeight }}>
          <div className="relative shrink-0 select-none" style={{ width: gutterPx }}>
            {hours.map((hour) => {
              const top = Math.max(0, (hour - dayStartHour) * rowPx - LABEL_BLEED_PX);
              // The current time reads in this gutter too; drop the hour it
              // lands on rather than print the two over each other.
              if (nowLabel && Math.abs(top - nowLabel.top) < HOUR_LABEL_PX) return null;
              return (
                <span
                  key={hour}
                  className="absolute right-2 text-body-secondary text-text-secondary tabular-nums"
                  style={{ top }}
                >
                  {pad2(hour)}:00
                </span>
              );
            })}
            {nowLabel && (
              <span
                data-testid="time-grid-now-label"
                style={{ top: nowLabel.top }}
                // Opaque and above the hour labels, so it covers the one it
                // lands on rather than printing over it.
                className="absolute right-1 z-10 rounded-full bg-bg-alert-strong px-1.5 text-body-secondary text-text-on-dark tabular-nums"
              >
                {nowLabel.text}
              </span>
            )}
          </div>

          <div className="relative min-w-0 flex-1">
            {hours.map((hour) => (
              <div
                key={hour}
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 border-t",
                  hour === dayStartHour ? "border-transparent" : "border-border-default",
                )}
                style={{ top: (hour - dayStartHour) * rowPx }}
              />
            ))}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
