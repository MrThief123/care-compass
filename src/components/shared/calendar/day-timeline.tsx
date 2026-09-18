"use client";

import { positionBlocks } from "@/lib/dates/position-blocks";
import { formatDuration } from "@/lib/format/duration";
import { cn } from "@/lib/utils";
import type { Occurrence } from "@/types/domain";

import { StatusPill } from "../status-pill";

export interface DayTimelineProps {
  occurrences: Occurrence[];
  /** Hour the gutter starts at (default 7 = 07:00). */
  startHour?: number;
  /** Hour the gutter ends at (default 18 = 18:00). */
  endHour?: number;
  rowPx?: number;
  onSelect?: (occurrence: Occurrence) => void;
  className?: string;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Family Home "Today" hour-gutter day view (UI-01 Scope). */
export function DayTimeline({
  occurrences,
  startHour = 7,
  endHour = 18,
  rowPx = 44,
  onSelect,
  className,
}: DayTimelineProps) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const blocks = positionBlocks(occurrences, { startHour, rowPx });
  const gridHeight = (hours.length - 1) * rowPx;

  return (
    <div className={cn("grid grid-cols-[56px_1fr]", className)}>
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
      <div className="relative border-l border-border-default" style={{ height: gridHeight }}>
        {blocks.map(({ item, top, height }) => (
          <button
            key={item.key}
            type="button"
            data-testid={`day-timeline-block-${item.key}`}
            style={{ top, height: Math.max(height, rowPx) }}
            onClick={() => onSelect?.(item)}
            className="absolute inset-x-1 flex flex-col items-start gap-0.5 overflow-hidden rounded-inset border-l-2 border-bg-brand bg-bg-surface p-1 text-left"
          >
            <span className="w-full truncate text-body-emphasis text-text-primary">
              {item.title}
            </span>
            {item.assignee && (
              <span className="w-full truncate text-body-small text-text-secondary">
                {item.assignee}
              </span>
            )}
            <span className="text-body-small text-text-secondary">
              {formatDuration(item.durationMinutes)}
            </span>
            <StatusPill status={item.status} actorName={item.actor} />
          </button>
        ))}
      </div>
    </div>
  );
}
