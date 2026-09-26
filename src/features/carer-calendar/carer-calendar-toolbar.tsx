"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import type { CalendarView } from "@/features/family-calendar/calendar-params";

const TO_OPTION: Record<CalendarView, SegmentedControlOption> = { day: "D", week: "W", month: "M" };
const FROM_OPTION: Record<SegmentedControlOption, CalendarView> = {
  D: "day",
  W: "week",
  M: "month",
};

export interface CarerCalendarToolbarProps {
  label: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
}

/**
 * 'Shifts' heading, range label with Previous/Next <unit>, Today, and D/W/M.
 * Family's `CalendarToolbar` always renders 'Enter event', which carers must
 * not have, so this is a local copy without it (DECISIONS.md FD-02). The
 * arrows and Today are a design gap, built from tokens (FD-01).
 */
export function CarerCalendarToolbar({
  label,
  view,
  onViewChange,
  onStep,
  onToday,
}: CarerCalendarToolbarProps) {
  const arrow =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text-secondary outline-none hover:bg-bg-inset focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-title-section text-text-primary">Shifts</h1>
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Previous ${view}`}
            aria-keyshortcuts="ArrowLeft"
            title={`Previous ${view} (←)`}
            onClick={() => onStep(-1)}
            className={arrow}
          >
            <Icon name="chevron-left" aria-hidden />
          </button>
          <p className="min-w-0 text-body-emphasis text-text-primary">{label}</p>
          <button
            type="button"
            aria-label={`Next ${view}`}
            aria-keyshortcuts="ArrowRight"
            title={`Next ${view} (→)`}
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
      </div>
      <SegmentedControl
        value={TO_OPTION[view]}
        onChange={(option) => onViewChange(FROM_OPTION[option])}
        className="shrink-0 bg-bg-surface [&_button]:min-h-11 [&_button]:min-w-11"
      />
    </div>
  );
}
