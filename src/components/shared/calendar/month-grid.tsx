"use client";

import { monthGrid } from "@/lib/dates/month-grid";
import type { LocalDate } from "@/lib/dates/week-range";
import { cn } from "@/lib/utils";

export interface MonthGridProps {
  /** Any date within the month to display. */
  month: LocalDate;
  today?: LocalDate;
  selected?: LocalDate;
  datesWithEvents?: LocalDate[];
  onSelectDate?: (date: LocalDate) => void;
  className?: string;
}

/** 6×7 month grid with default/today/selected/has-events/out-of-month cell states (UI-01 Scope). */
export function MonthGrid({
  month,
  today,
  selected,
  datesWithEvents = [],
  onSelectDate,
  className,
}: MonthGridProps) {
  const weeks = monthGrid(month);
  const eventDates = new Set(datesWithEvents);

  return (
    <div className={cn("grid grid-cols-7 gap-1", className)}>
      {weeks.map((week) =>
        week.map((cell) => {
          const isToday = cell.date === today;
          const isSelected = cell.date === selected;
          const hasEvents = eventDates.has(cell.date);
          const dayNumber = Number(cell.date.split("-")[2]);
          return (
            <button
              key={cell.date}
              type="button"
              data-testid={`month-grid-day-${cell.date}`}
              data-in-month={cell.inMonth}
              data-has-events={hasEvents}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              onClick={() => onSelectDate?.(cell.date)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-inset py-1 text-body-small",
                !cell.inMonth && "text-text-muted",
                cell.inMonth && !isSelected && "text-text-primary",
                isSelected && "bg-primary text-primary-foreground",
                isToday && !isSelected && "border border-border-brand",
              )}
            >
              <span>{dayNumber}</span>
              {hasEvents && (
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
  );
}
