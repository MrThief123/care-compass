"use client";

import { monthGrid } from "@/lib/dates/month-grid";
import type { LocalDate } from "@/lib/dates/week-range";
import { cn } from "@/lib/utils";

import { Icon } from "../../ui/icon";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface DatePickerGridProps {
  /** Any date within the month to display. */
  month: LocalDate;
  selected?: LocalDate;
  datesWithItems?: LocalDate[];
  onSelect?: (date: LocalDate) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  className?: string;
}

function monthLabel(month: LocalDate): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return `${MONTH_LABELS[monthIndex! - 1]} ${year}`;
}

/** Month picker with dots for days with items (UI-01 Scope: `DatePickerGrid`). */
export function DatePickerGrid({
  month,
  selected,
  datesWithItems = [],
  onSelect,
  onPrevMonth,
  onNextMonth,
  className,
}: DatePickerGridProps) {
  const weeks = monthGrid(month);
  const itemDates = new Set(datesWithItems);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={onPrevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary hover:bg-bg-inset"
        >
          <Icon name="chevron-left" aria-hidden />
        </button>
        <span className="text-title-section text-text-primary">{monthLabel(month)}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={onNextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary hover:bg-bg-inset"
        >
          <Icon name="chevron-right" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-body-secondary text-text-secondary">
            {label}
          </div>
        ))}
        {weeks.map((week) =>
          week.map((cell) => {
            const isSelected = cell.date === selected;
            const hasItems = itemDates.has(cell.date);
            const dayNumber = Number(cell.date.split("-")[2]);
            return (
              <button
                key={cell.date}
                type="button"
                data-testid={`date-picker-day-${cell.date}`}
                data-in-month={cell.inMonth}
                data-has-items={hasItems}
                aria-pressed={isSelected}
                onClick={() => onSelect?.(cell.date)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-full py-1 text-body-small",
                  !cell.inMonth && "text-text-muted",
                  cell.inMonth && !isSelected && "text-text-primary",
                  isSelected && "bg-primary text-primary-foreground",
                )}
              >
                <span>{dayNumber}</span>
                {hasItems && (
                  <span
                    aria-hidden
                    className={cn(
                      "h-1 w-1 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-bg-brand",
                    )}
                  />
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
