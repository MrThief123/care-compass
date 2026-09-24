"use client";

import { useEffect, useRef } from "react";

import type { CalendarView } from "./calendar-params";

export interface CalendarShortcutHandlers {
  onViewChange: (view: CalendarView) => void;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
}

const VIEW_KEYS: Record<string, CalendarView> = { d: "day", w: "week", m: "month" };

/** Text entry keeps its keys: typing "d" in a search box must not switch the view. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) {
    return !["checkbox", "radio", "button", "submit", "reset"].includes(target.type);
  }
  return false;
}

/**
 * D / W / M switch the view, ← / → step a day, week or month, T goes back to
 * today (FAM-UI-02 AC-06, AC-07). Ignored with a modifier held (browser and OS
 * shortcuts), on a held-down repeat (each step is a navigation) and while
 * typing.
 */
export function useCalendarShortcuts(handlers: CalendarShortcutHandlers): void {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;

      const { onViewChange, onStep, onToday } = latest.current;
      const key = event.key.toLowerCase();
      const view = VIEW_KEYS[key];
      if (view) onViewChange(view);
      else if (key === "t") onToday();
      else if (event.key === "ArrowLeft") onStep(-1);
      else if (event.key === "ArrowRight") onStep(1);
      else return;
      event.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
