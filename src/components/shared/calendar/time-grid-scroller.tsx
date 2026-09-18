"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

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
  /** Rendered above the scroll area, indented to line up with the columns. */
  header?: ReactNode;
  /** Column content, positioned inside a `relative` box of the full day's height. */
  children: ReactNode;
  className?: string;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
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
  header,
  children,
  className,
}: TimeGridScrollerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const offsetPx = (focusStartHour - dayStartHour) * rowPx;

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = offsetPx;
  }, [offsetPx]);

  const hours = Array.from({ length: dayEndHour - dayStartHour }, (_, i) => dayStartHour + i);
  const gridHeight = hours.length * rowPx;
  const viewportHeight = (focusEndHour - focusStartHour) * rowPx;

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
            {hours.map((hour) => (
              <span
                key={hour}
                className="absolute right-2 text-body-secondary text-text-secondary tabular-nums"
                style={{ top: Math.max(0, (hour - dayStartHour) * rowPx - 8) }}
              >
                {pad2(hour)}:00
              </span>
            ))}
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
