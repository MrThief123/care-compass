"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Icon } from "./icon";

const LEAVE_DELAY_MS = 150;

export interface InfoTipProps {
  /** What the button it sits beside is called; names this one "About <label>". */
  label: string;
  /** One short sentence saying what that button does. */
  text: string;
  /** Which edge of the "i" the tip lines up with; `end` opens leftwards, away from the screen edge. */
  align?: "start" | "end";
  className?: string;
}

/**
 * A small "i" button that explains the main button beside it (FAM-17).
 * A toggletip, not a hover-only tooltip: the tip shows on hover and on keyboard
 * focus, a click or tap pins it open, and Esc, blur, an outside click or a second
 * click close it (WCAG 1.4.13: dismissible, hoverable, persistent). The tip sits
 * inside the same wrapper as the button, so moving the pointer onto it does not
 * close it. The "i" is a 44px target; the icon is small.
 */
export function InfoTip({ label, text, align = "end", className }: InfoTipProps) {
  const tipId = useId();
  const wrapper = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cancelLeave = useCallback(() => clearTimeout(leaveTimer.current), []);

  const close = useCallback(() => {
    cancelLeave();
    setOpen(false);
    setPinned(false);
  }, [cancelLeave]);

  useEffect(() => cancelLeave, [cancelLeave]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  return (
    <span
      ref={wrapper}
      className={cn("relative inline-flex shrink-0", className)}
      onMouseEnter={() => {
        cancelLeave();
        setOpen(true);
      }}
      onMouseLeave={() => {
        // A beat of grace, so a pointer crossing from the "i" to the tip does not lose it.
        if (!pinned) leaveTimer.current = setTimeout(() => setOpen(false), LEAVE_DELAY_MS);
      }}
      onBlur={(event) => {
        if (!wrapper.current?.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onFocus={() => setOpen(true)}
        onClick={() => {
          if (pinned) {
            close();
          } else {
            setPinned(true);
            setOpen(true);
          }
        }}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors outline-none hover:bg-bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Icon name="info" aria-hidden />
      </button>
      {open && (
        // The padding bridges the gap to the button, so the pointer can cross it.
        <span className={cn("absolute top-full z-50 pt-1", align === "end" ? "right-0" : "left-0")}>
          <span
            id={tipId}
            role="tooltip"
            className="block w-64 max-w-[calc(100vw-2rem)] rounded-control border border-border-brand bg-bg-surface px-3 py-2 text-left text-body-small text-text-primary shadow-md"
          >
            {text}
          </span>
        </span>
      )}
    </span>
  );
}
