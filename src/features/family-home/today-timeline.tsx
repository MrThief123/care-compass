"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useCurrentTime } from "@/components/shared/calendar/current-time-line";
import {
  melbourneMinutesOfDay,
  melbourneTimeRange,
} from "@/components/shared/calendar/melbourne-time";
import { STATUS_CUE } from "@/components/shared/calendar/status-cue";
import { StatusPill } from "@/components/shared/status-pill";
import { formatDuration } from "@/lib/format/duration";
import { cn } from "@/lib/utils";
import type { Occurrence } from "@/types/domain";

import { homeRoutes } from "./home-routes";
import { layoutDay } from "./today-layout";

export interface TodayTimelineProps {
  clientId: string;
  /** Today's occurrences, in any order and any number. */
  occurrences: Occurrence[];
  /** Pins the current-time line (tests); omit to track the real clock, `null` for no line. */
  now?: Date | null;
  className?: string;
}

/** The pill's own text, which is also its hover title when a long name is cut short. */
function statusText(occurrence: Occurrence): string {
  if (occurrence.status === "done") return `Done · ${occurrence.actor ?? "—"}`;
  return occurrence.status === "overdue" ? "Overdue" : "Planned";
}

/**
 * The Family · Home day view (design `family-01-home`): an hour scale down the
 * left and one full-width row per occurrence, each carrying its title,
 * assignee, duration and status pill at rest, with no hover needed. Each row
 * opens that occurrence's task detail. Layout, including how a crowded or
 * overlapping day stacks, is `layoutDay`'s (DECISIONS.md FD-14).
 *
 * A local component rather than the shared `DayTimeline`: that kit shows the
 * pill, assignee and duration only on a hover card at these block heights, and
 * a hover card is no use to someone on a keyboard or a touch screen (FD-09).
 */
export function TodayTimeline({ clientId, occurrences, now, className }: TodayTimelineProps) {
  const layout = useMemo(() => layoutDay(occurrences), [occurrences]);
  const clock = useCurrentTime(now);
  const nowY = clock ? layout.yAt(melbourneMinutesOfDay(clock.toISOString())) : null;

  return (
    <div className={cn("relative", className)} style={{ height: layout.canvasHeight }}>
      {/* The hour scale is decoration: each row's accessible name carries its own time range. */}
      {layout.hours.map((mark) => (
        <div
          key={mark.hour}
          aria-hidden
          className="absolute inset-x-0 border-t border-border-subtle"
          style={{ top: mark.top }}
        >
          <span
            className={cn(
              "absolute top-2 left-0 text-body-small tabular-nums",
              mark.startsEvent ? "text-text-primary" : "text-text-secondary",
            )}
          >
            {`${String(mark.hour).padStart(2, "0")}:00`}
          </span>
        </div>
      ))}

      <ul aria-label="Care events today" className="absolute inset-y-0 right-0 left-16">
        {layout.blocks.map(({ occurrence, top, height, pushed }) => {
          const cue = STATUS_CUE[occurrence.status];
          const minutes = Number.isFinite(occurrence.durationMinutes)
            ? Math.max(0, occurrence.durationMinutes)
            : 0;
          const status = statusText(occurrence);

          return (
            <li
              key={occurrence.key}
              data-stacked={pushed ? "true" : undefined}
              className="absolute"
              style={{ top, height, left: "0px", right: "0px" }}
            >
              <Link
                href={homeRoutes.taskDetail(clientId, occurrence.key)}
                className="absolute inset-x-0 inset-y-px flex items-center gap-3 overflow-hidden rounded-inset border border-border-brand bg-bg-inset pr-3 outline-none hover:bg-bg-brand-pale focus-visible:z-10 focus-visible:bg-bg-brand-pale focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {/* Colour is only the accent: the status is the pill's word and icon. */}
                <span aria-hidden className={cn("h-full w-1 shrink-0", cue.bar)} />
                <span className="sr-only">{`${melbourneTimeRange(occurrence.start, minutes)}, `}</span>
                <span
                  title={occurrence.title}
                  className="min-w-0 truncate text-title-card text-text-primary"
                >
                  {occurrence.title}
                </span>
                {occurrence.assignee ? (
                  <span
                    title={occurrence.assignee}
                    className="max-w-[30%] min-w-0 truncate text-body-small text-text-secondary"
                  >
                    {occurrence.assignee}
                  </span>
                ) : (
                  <>
                    <span aria-hidden className="shrink-0 text-body-small text-text-secondary">
                      —
                    </span>
                    <span className="sr-only">No carer assigned, </span>
                  </>
                )}
                <span className="shrink-0 text-body-small text-text-secondary tabular-nums">
                  {formatDuration(minutes)}
                </span>
                <span title={status} className="ml-auto flex max-w-[40%] min-w-0 shrink-0">
                  <StatusPill
                    status={occurrence.status}
                    actorName={occurrence.actor ?? "—"}
                    className="min-w-0"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {nowY !== null && (
        <div
          data-testid="current-time-line"
          aria-hidden
          style={{ top: nowY }}
          className="pointer-events-none absolute inset-x-0 z-20 flex -translate-y-1/2 items-center"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-bg-alert-strong" />
          <span className="h-0.5 flex-1 bg-bg-alert-strong" />
        </div>
      )}
    </div>
  );
}
