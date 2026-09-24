import Link from "next/link";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { ActivityLinkRow } from "@/features/family-home/activity-link-row";
import { shortDate } from "@/features/family-home/home-format";
import { taskDetailHrefFrom } from "@/features/family-task-detail/task-detail-origin";
import { taskLogHref } from "@/features/family-task-log/task-routes";
import type { Occurrence } from "@/types/domain";

import type { CalendarParams } from "./calendar-params";

export interface LogPanelProps {
  clientId: string;
  /** The latest done or overdue tasks, newest first. */
  occurrences: Occurrence[];
  /** The calendar's current view and day; a row's task detail returns to it (CHG-014). */
  calendar: CalendarParams;
}

/**
 * Log: the latest things that happened, each opening its task detail, and
 * 'View all' for the Task log. Rows are Home's `ActivityLinkRow` (a real link,
 * a title that wraps, a pill that is never squeezed), not the kit's
 * `ActivityRow` button (DECISIONS.md FD-05).
 */
export function LogPanel({ clientId, occurrences, calendar }: LogPanelProps) {
  return (
    <section aria-labelledby="family-calendar-log" className="min-w-0">
      <CardShell className="flex h-full flex-col gap-2 px-5 py-4">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 id="family-calendar-log" className="text-title-card text-text-primary">
            Log
          </h2>
          <Link
            href={taskLogHref(clientId)}
            className="inline-flex min-h-11 items-center px-3 text-body-emphasis text-text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            View all
          </Link>
        </div>
        {occurrences.length === 0 ? (
          <EmptyState
            icon="clipboard-check"
            title="No activity yet"
            body="Completed and overdue tasks will appear here."
          />
        ) : (
          <ul>
            {occurrences.map((occurrence) => (
              <li key={occurrence.key}>
                <ActivityLinkRow
                  href={taskDetailHrefFrom(clientId, occurrence.key, {
                    from: "calendar",
                    view: calendar,
                  })}
                  title={occurrence.title}
                  date={shortDate(occurrence.start)}
                  status={occurrence.status}
                  // REQ-19: a Done pill always names who did it.
                  actorName={occurrence.actor ?? "—"}
                />
              </li>
            ))}
          </ul>
        )}
      </CardShell>
    </section>
  );
}
