"use client";

import { positionBlocks } from "@/lib/dates/position-blocks";
import type { LocalDate } from "@/lib/dates/week-range";
import { cn } from "@/lib/utils";
import type { Occurrence } from "@/types/domain";

import { melbourneDateTime } from "./melbourne-time";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export interface WeekGridProps {
  /** Monday of the visible week. */
  weekStart: LocalDate;
  occurrences: Occurrence[];
  today?: LocalDate;
  /** Overrides the default "HH:mm Title" block label (e.g. carer "Margaret — Morning m…"). */
  labelFormat?: (occurrence: Occurrence) => string;
  startHour?: number;
  endHour?: number;
  rowPx?: number;
  onSelectDay?: (date: LocalDate) => void;
  className?: string;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function addDays(date: LocalDate, amount: number): LocalDate {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, day! + amount));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

/** MON–SUN week grid with an hour gutter (UI-01 Scope). */
export function WeekGrid({
  weekStart,
  occurrences,
  today,
  labelFormat,
  startHour = 7,
  endHour = 18,
  rowPx = 44,
  onSelectDay,
  className,
}: WeekGridProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const gridHeight = (hours.length - 1) * rowPx;

  const occurrencesByDay = new Map<LocalDate, Occurrence[]>();
  for (const day of days) occurrencesByDay.set(day, []);
  for (const occurrence of occurrences) {
    const { date } = melbourneDateTime(occurrence.start);
    occurrencesByDay.get(date)?.push(occurrence);
  }

  return (
    <div className={cn("grid grid-cols-[56px_repeat(7,1fr)]", className)}>
      <div />
      {days.map((day, index) => {
        const isToday = day === today;
        const dayNumber = Number(day.split("-")[2]);
        return (
          <button
            key={day}
            type="button"
            data-testid={`week-grid-header-${day}`}
            aria-current={isToday ? "date" : undefined}
            onClick={() => onSelectDay?.(day)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-inset py-1 text-body-small",
              isToday ? "bg-bg-brand-pale text-text-brand" : "text-text-secondary",
            )}
          >
            <span>{DAY_LABELS[index]}</span>
            <span className="text-body-emphasis text-text-primary">{dayNumber}</span>
          </button>
        );
      })}

      <div>
        {hours.map((hour) => (
          <div
            key={hour}
            style={{ height: rowPx }}
            className="text-body-secondary text-text-secondary"
          >
            {pad2(hour)}:00
          </div>
        ))}
      </div>

      {days.map((day) => (
        <div
          key={day}
          data-testid={`week-grid-day-${day}`}
          className="relative border-l border-border-default"
          style={{ height: gridHeight }}
        >
          {positionBlocks(occurrencesByDay.get(day) ?? [], { startHour, rowPx }).map(
            ({ item, top, height }) => {
              const { time } = melbourneDateTime(item.start);
              return (
                <div
                  key={item.key}
                  style={{ top, height: Math.max(height, rowPx / 2) }}
                  className="absolute inset-x-0.5 overflow-hidden rounded-inset border-l-2 border-bg-brand bg-bg-surface px-1 text-body-small text-text-primary"
                >
                  {labelFormat ? labelFormat(item) : `${time} ${item.title}`}
                </div>
              );
            },
          )}
        </div>
      ))}
    </div>
  );
}
