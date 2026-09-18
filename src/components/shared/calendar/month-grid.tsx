"use client";

import { Icon } from "@/components/ui/icon";
import { monthGrid } from "@/lib/dates/month-grid";
import type { LocalDate } from "@/lib/dates/week-range";
import { cn } from "@/lib/utils";
import type { Occurrence } from "@/types/domain";

import { melbourneDateTime } from "./melbourne-time";
import { STATUS_CUE } from "./status-cue";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export interface MonthGridProps {
  /** Any date within the month to display. */
  month: LocalDate;
  today?: LocalDate;
  selected?: LocalDate;
  occurrences?: Occurrence[];
  /**
   * Replaces the whole default chip label (start time + title) with one
   * string, e.g. the carer view's "Margaret — Morning m…".
   */
  labelFormat?: (occurrence: Occurrence) => string;
  /**
   * Rows a day cell can show before the rest collapse into an "N more" row.
   * The overflow row occupies one of these rows, matching Notion/Google
   * month views. Default 3, which fits the ~120px minimum cell height.
   */
  maxChipsPerDay?: number;
  onSelectDate?: (date: LocalDate) => void;
  className?: string;
}

/** 6×7 month grid with event chips per day (UI-01 Scope: `MonthGrid`). */
export function MonthGrid({
  month,
  today,
  selected,
  occurrences = [],
  labelFormat,
  maxChipsPerDay = 4,
  onSelectDate,
  className,
}: MonthGridProps) {
  const weeks = monthGrid(month);

  const occurrencesByDay = new Map<LocalDate, Occurrence[]>();
  for (const occurrence of occurrences) {
    const { date } = melbourneDateTime(occurrence.start);
    const existing = occurrencesByDay.get(date);
    if (existing) existing.push(occurrence);
    else occurrencesByDay.set(date, [occurrence]);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="grid shrink-0 grid-cols-7">
        {DAY_LABELS.map((label) => (
          <div key={label} className="px-1 pb-1 text-label-caps text-text-secondary">
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIndex) => (
        <div
          key={weekIndex}
          className="grid min-h-[120px] flex-1 grid-cols-7 border-t border-border-default"
        >
          {week.map((cell, dayIndex) => {
            const isToday = cell.date === today;
            const isSelected = cell.date === selected;
            const dayOccurrences = occurrencesByDay.get(cell.date) ?? [];
            const dayNumber = Number(cell.date.split("-")[2]);

            // The "N more" row takes one of the rows, so only cap when the
            // day actually overflows. Always keep at least one chip visible —
            // a cell reading only "3 more" tells the reader nothing.
            const overflows = dayOccurrences.length > maxChipsPerDay;
            const visibleCount = overflows ? Math.max(maxChipsPerDay - 1, 1) : maxChipsPerDay;
            const visible = dayOccurrences.slice(0, visibleCount);
            const hiddenCount = dayOccurrences.length - visible.length;

            return (
              <button
                key={cell.date}
                type="button"
                data-testid={`month-grid-day-${cell.date}`}
                data-in-month={cell.inMonth}
                data-has-events={dayOccurrences.length > 0}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                onClick={() => onSelectDate?.(cell.date)}
                className={cn(
                  "flex min-h-0 min-w-0 flex-col items-stretch gap-1 overflow-hidden p-1 text-left",
                  dayIndex > 0 && "border-l border-border-subtle",
                  !cell.inMonth && "bg-bg-inset/40",
                  isSelected && "bg-bg-inset",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full text-body-small",
                    isSelected && "bg-bg-brand-deep text-text-on-dark",
                    isToday && !isSelected && "border border-border-brand text-text-brand",
                    !isToday && !isSelected && "text-text-primary",
                    !cell.inMonth && !isSelected && "text-text-muted",
                  )}
                >
                  {dayNumber}
                </span>

                <span
                  className={cn(
                    "flex min-h-0 min-w-0 flex-col gap-0.5 overflow-hidden",
                    !cell.inMonth && "opacity-60",
                  )}
                >
                  {visible.map((occurrence) => {
                    const { time } = melbourneDateTime(occurrence.start);
                    const cue = STATUS_CUE[occurrence.status];
                    return (
                      <span
                        key={occurrence.key}
                        className="flex min-w-0 shrink-0 items-stretch overflow-hidden rounded-inset border border-border-default bg-bg-surface"
                      >
                        <span className={cn("w-1 shrink-0", cue.bar)} aria-hidden />
                        <span className="sr-only">{cue.label}: </span>
                        <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden px-1 py-0.5">
                          {cue.icon && (
                            <Icon
                              name={cue.icon}
                              size={14}
                              className={cn(
                                "shrink-0",
                                occurrence.status === "overdue"
                                  ? "text-text-alert-strong"
                                  : "text-text-brand",
                              )}
                            />
                          )}
                          {labelFormat ? (
                            <span className="min-w-0 truncate text-body-small text-text-primary">
                              {labelFormat(occurrence)}
                            </span>
                          ) : (
                            <>
                              <span className="shrink-0 text-body-secondary tabular-nums text-text-secondary">
                                {time}
                              </span>
                              <span className="min-w-0 truncate text-body-small text-text-primary">
                                {occurrence.title}
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                    );
                  })}

                  {hiddenCount > 0 && (
                    <span className="shrink-0 truncate px-1 text-body-secondary text-text-secondary">
                      {hiddenCount} more
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
