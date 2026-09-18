"use client";

import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import type { WeekRange } from "@/lib/dates/week-range";
import { cn } from "@/lib/utils";

import { Icon } from "../../ui/icon";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface CalendarHeaderProps {
  range: WeekRange;
  view?: SegmentedControlOption;
  onViewChange?: (view: SegmentedControlOption) => void;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

function formatRangeLabel({ start, end }: WeekRange): string {
  const [, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  return `${startDay} ${MONTH_LABELS[startMonth! - 1]} – ${endDay} ${MONTH_LABELS[endMonth! - 1]} ${endYear}`;
}

/** Range label, prev/next and D/W/M segmented control (UI-01 Scope). */
export function CalendarHeader({
  range,
  view,
  onViewChange,
  onPrev,
  onNext,
  className,
}: CalendarHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous"
          onClick={onPrev}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary hover:bg-bg-inset"
        >
          <Icon name="chevron-left" aria-hidden />
        </button>
        <span className="text-title-section text-text-primary">{formatRangeLabel(range)}</span>
        <button
          type="button"
          aria-label="Next"
          onClick={onNext}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary hover:bg-bg-inset"
        >
          <Icon name="chevron-right" aria-hidden />
        </button>
      </div>
      <SegmentedControl value={view} onChange={onViewChange} />
    </div>
  );
}
