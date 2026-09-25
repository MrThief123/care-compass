"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AnyOccurrence } from "@/types/domain";

import type { FocusEvent, PointerEvent } from "react";

/** Hover intent: long enough that sweeping across the grid pops nothing. */
const OPEN_DELAY_MS = 120;
/**
 * Grace period on leaving a block, so the pointer can cross the 8px gap into
 * the card without it vanishing (WCAG 1.4.13 "Hoverable").
 */
const CLOSE_DELAY_MS = 200;

export interface HoveredEvent {
  occurrence: AnyOccurrence;
  anchor: HTMLElement;
}

export interface EventHover {
  /** The event whose card is showing, if any. */
  hovered: HoveredEvent | null;
  /** The card's DOM id, for the block's `aria-describedby`. */
  describedBy: (occurrence: AnyOccurrence) => string | undefined;
  /** Spread onto an event block. */
  blockProps: (occurrence: AnyOccurrence) => {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
    onPointerDown: () => void;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onBlur: () => void;
  };
  /** Spread onto the card, so the pointer can rest on it. */
  cardProps: {
    id: string;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  };
  close: () => void;
}

/**
 * Hover-and-focus control for an event block's detail card.
 *
 * Clicking an event means "open it for editing" (UI-02), so the card that
 * carries what a short block could not fit is shown on hover instead, and on
 * keyboard focus so it is not mouse-only. A press on the block dismisses it
 * rather than leaving it over the editor.
 */
export function useEventHover(idPrefix = "event-detail"): EventHover {
  const [hovered, setHovered] = useState<HoveredEvent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Clicking a block focuses it. Only keyboard focus should raise the card;
  // a click is on its way to the editor and the card must stay out of it.
  const focusFromPointer = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const open = useCallback(
    (occurrence: AnyOccurrence, anchor: HTMLElement, delay: number) => {
      cancel();
      if (delay === 0) {
        setHovered({ occurrence, anchor });
        return;
      }
      timer.current = setTimeout(() => setHovered({ occurrence, anchor }), delay);
    },
    [cancel],
  );

  const close = useCallback(
    (delay: number) => {
      cancel();
      if (delay === 0) {
        setHovered(null);
        return;
      }
      timer.current = setTimeout(() => setHovered(null), delay);
    },
    [cancel],
  );

  const cardId = `${idPrefix}-card`;

  return {
    hovered,
    describedBy: (occurrence) => (hovered?.occurrence.key === occurrence.key ? cardId : undefined),
    blockProps: (occurrence) => ({
      // A touch tap has no hover state and goes straight on to the click that
      // opens the editor, so it must not also raise the card.
      onPointerEnter: (event) => {
        if (event.pointerType === "touch") return;
        open(occurrence, event.currentTarget, OPEN_DELAY_MS);
      },
      onPointerLeave: () => close(CLOSE_DELAY_MS),
      onPointerDown: () => {
        focusFromPointer.current = true;
        close(0);
      },
      onFocus: (event) => {
        if (focusFromPointer.current) {
          focusFromPointer.current = false;
          return;
        }
        open(occurrence, event.currentTarget, 0);
      },
      onBlur: () => {
        focusFromPointer.current = false;
        close(0);
      },
    }),
    cardProps: {
      id: cardId,
      onPointerEnter: cancel,
      onPointerLeave: () => close(CLOSE_DELAY_MS),
    },
    close: () => close(0),
  };
}
