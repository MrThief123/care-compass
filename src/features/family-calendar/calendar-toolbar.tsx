"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";

import type { CalendarView } from "./calendar-params";

const TO_OPTION: Record<CalendarView, SegmentedControlOption> = { day: "D", week: "W", month: "M" };
const FROM_OPTION: Record<SegmentedControlOption, CalendarView> = {
  D: "day",
  W: "week",
  M: "month",
};

export interface CalendarToolbarProps {
  label: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
  /** Add event, carrying this view so its Save and Cancel return here (CHG-017). */
  enterEventHref: string;
}

/**
 * Range heading, Previous/Next and D/W/M. Local rather than the kit's
 * `CalendarHeader`, which can only label a week range and names its arrows
 * "Previous"/"Next" whatever the view; the day and month views need their own
 * heading ("Friday 4 December 2026", "December 2026") and the arrows need to
 * say what they move by (DECISIONS.md FD-04). The heading is the page's h1.
 * The arrows and Today name their keyboard shortcuts (`use-calendar-shortcuts`).
 * 'Enter event' is Home's primary action at the toolbar's 44px height, a link
 * styled as the kit's primary Button (CHG-017, DECISIONS.md FD-14).
 */
export function CalendarToolbar({
  label,
  view,
  onViewChange,
  onStep,
  onToday,
  enterEventHref,
}: CalendarToolbarProps) {
  const unit = view;
  const arrow =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text-secondary outline-none hover:bg-bg-inset focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Previous ${unit}`}
          aria-keyshortcuts="ArrowLeft"
          title={`Previous ${unit} (←)`}
          onClick={() => onStep(-1)}
          className={arrow}
        >
          <Icon name="chevron-left" aria-hidden />
        </button>
        <h1 className="min-w-0 text-title-section text-text-primary">{label}</h1>
        <button
          type="button"
          aria-label={`Next ${unit}`}
          aria-keyshortcuts="ArrowRight"
          title={`Next ${unit} (→)`}
          onClick={() => onStep(1)}
          className={arrow}
        >
          <Icon name="chevron-right" aria-hidden />
        </button>
        <Button
          variant="secondary"
          aria-keyshortcuts="T"
          title="Today (T)"
          onClick={onToday}
          className="ml-2 shrink-0"
        >
          Today
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href={enterEventHref}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-control bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Enter event
        </Link>
        <SegmentedControl
          value={TO_OPTION[view]}
          onChange={(option) => onViewChange(FROM_OPTION[option])}
          className="bg-bg-surface [&_button]:min-h-11 [&_button]:min-w-11"
        />
      </div>
    </div>
  );
}
