"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { formatDuration } from "@/lib/format/duration";
import { cn } from "@/lib/utils";
import type { Occurrence } from "@/types/domain";

import { StatusPill } from "../status-pill";

import { melbourneTimeRange } from "./melbourne-time";

export interface EventPopoverProps {
  occurrence: Occurrence;
  /** The block that was clicked; the card is placed beside it. */
  anchor: HTMLElement | null;
  onClose: () => void;
  className?: string;
}

const CARD_WIDTH = 288;
const GAP = 8;
const MARGIN = 8;

/**
 * The detail a short event block had no room to show, opened on click.
 *
 * Portalled to `document.body` and positioned `fixed` beside the block,
 * because the blocks live inside the scrolling hour canvas and an in-flow card
 * would be clipped by it. Closes on Escape, on a click outside, and on any
 * scroll or resize that would strand it away from its block.
 */
export function EventPopover({ occurrence, anchor, onClose, className }: EventPopoverProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const height = cardRef.current?.offsetHeight ?? 0;
    const spillsRight = rect.right + GAP + CARD_WIDTH > window.innerWidth - MARGIN;
    setPosition({
      left: spillsRight
        ? Math.max(MARGIN, rect.left - GAP - CARD_WIDTH)
        : Math.min(rect.right + GAP, window.innerWidth - MARGIN - CARD_WIDTH),
      top: Math.max(MARGIN, Math.min(rect.top, window.innerHeight - MARGIN - height)),
    });
  }, [anchor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (cardRef.current?.contains(target) || anchor?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={cardRef}
      role="dialog"
      aria-label={occurrence.title}
      data-testid={`event-popover-${occurrence.key}`}
      style={{
        width: CARD_WIDTH,
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
      className={cn(
        "fixed z-50 flex flex-col gap-2 rounded-card border border-border-default bg-bg-surface p-4 shadow-lg",
        className,
      )}
    >
      <p className="text-title-card text-text-primary">{occurrence.title}</p>
      <p className="text-body-small text-text-secondary tabular-nums">
        {melbourneTimeRange(occurrence.start, occurrence.durationMinutes)} ·{" "}
        {formatDuration(occurrence.durationMinutes)}
      </p>
      {occurrence.assignee ? (
        <p className="text-body-small text-text-secondary">{occurrence.assignee}</p>
      ) : null}
      {occurrence.description ? (
        <p className="text-body-small text-text-primary">{occurrence.description}</p>
      ) : null}
      <StatusPill status={occurrence.status} actorName={occurrence.actor} className="self-start" />
    </div>,
    document.body,
  );
}
