"use client";

import { useSyncExternalStore } from "react";

import type { LocalDate } from "@/lib/dates/week-range";
import { cn } from "@/lib/utils";

import { melbourneDateTime, melbourneMinutesOfDay } from "./melbourne-time";

/** How often the line steps down the canvas. */
const TICK_MS = 60_000;

/**
 * One minute-resolution clock for the whole page: a single interval, and every
 * view reading the same instant rather than each keeping its own timer that
 * could land a minute apart.
 */
const listeners = new Set<() => void>();
let currentMinute: Date | null = null;
let interval: ReturnType<typeof setInterval> | null = null;

function subscribeToClock(listener: () => void): () => void {
  listeners.add(listener);
  if (!interval) {
    // React re-reads the snapshot straight after subscribing, so the first
    // reading needs no notification of its own.
    currentMinute = new Date();
    interval = setInterval(() => {
      currentMinute = new Date();
      for (const notify of listeners) notify();
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0 || !interval) return;
    clearInterval(interval);
    interval = null;
    currentMinute = null;
  };
}

function readClock(): Date | null {
  return currentMinute;
}

function noClock(): null {
  return null;
}

function subscribeToNothing(): () => void {
  return () => {};
}

/**
 * The wall clock, re-read every minute.
 *
 * Reads `null` on the server and until the first client tick, so both render
 * the same markup — the line is a live decoration, not content, and appearing
 * one frame after hydration costs nothing.
 *
 * `undefined` tracks the real clock; a `Date` pins it (tests, and any caller
 * sharing one clock with `TimeGridScroller`); `null` turns it off.
 */
export function useCurrentTime(now?: Date | null): Date | null {
  const pinned = now !== undefined;
  const ticking = useSyncExternalStore(
    pinned ? subscribeToNothing : subscribeToClock,
    pinned ? noClock : readClock,
    noClock,
  );
  return pinned ? now : ticking;
}

export interface CurrentTimeLineProps {
  /** The clock to draw; omit to track the real one, `null` to draw nothing. */
  now?: Date | null;
  /** First hour of the canvas the line sits on (default 0 = 00:00). */
  dayStartHour?: number;
  /** Hour the canvas ends at (default 24 = 23:59). */
  dayEndHour?: number;
  /** Pixel height of one hour row — the same value the blocks are placed with. */
  rowPx?: number;
  /** Draw only when the clock falls on this Melbourne date (a week column). */
  onDate?: LocalDate;
  className?: string;
}

/**
 * The red "now" rule across the hour canvas.
 *
 * Positioned off the same `rowPx` arithmetic as the event blocks, so it lands
 * exactly where an event starting this minute would. `aria-hidden`: it is a
 * visual anchor for scanning the grid, and `TimeGridScroller` already labels
 * the same moment in the hour gutter as readable text.
 */
export function CurrentTimeLine({
  now: pinned,
  dayStartHour = 0,
  dayEndHour = 24,
  rowPx = 44,
  onDate,
  className,
}: CurrentTimeLineProps) {
  const now = useCurrentTime(pinned);
  if (!now) return null;

  const iso = now.toISOString();
  if (onDate && melbourneDateTime(iso).date !== onDate) return null;

  const hoursIn = melbourneMinutesOfDay(iso) / 60;
  if (hoursIn < dayStartHour || hoursIn > dayEndHour) return null;

  return (
    <div
      data-testid="current-time-line"
      aria-hidden
      style={{ top: (hoursIn - dayStartHour) * rowPx }}
      className={cn(
        "pointer-events-none absolute inset-x-0 z-20 flex -translate-y-1/2 items-center",
        className,
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-bg-alert-strong" />
      <span className="h-0.5 flex-1 bg-bg-alert-strong" />
    </div>
  );
}
