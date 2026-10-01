"use client";

import { TaskChecklist } from "@/components/shared/lists/task-checklist";
import { EmptyState } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status-pill";
import { CardShell } from "@/components/ui/card-shell";
import type { Occurrence } from "@/types/domain";

export interface TasksPanelProps {
  /** "Monday 30 November". */
  dateLabel: string;
  occurrences: Occurrence[];
  isTicked: (occurrence: Occurrence) => boolean;
  onToggle: (key: string, ticked: boolean) => void;
  /** FAM-05 AC-02: shown when the last tick or untick failed to save. */
  errorMessage?: string;
  /**
   * No tick boxes: each task shows its status as text instead (a carer with no shift in
   * progress, CHG-043). The boxes are absent, not disabled.
   */
  readOnly?: boolean;
}

/**
 * Tasks: the selected day's care events as a checklist. Ticking calls
 * `setOccurrenceDone`/`setOccurrenceUndone` (FAM-05); the caller applies the
 * tick optimistically and reverts it here via `isTicked` if the save fails.
 */
export function TasksPanel({
  dateLabel,
  occurrences,
  isTicked,
  onToggle,
  errorMessage,
  readOnly = false,
}: TasksPanelProps) {
  return (
    <section aria-labelledby="family-calendar-tasks" className="min-w-0">
      <CardShell className="flex h-full flex-col gap-3 px-5 py-4">
        <div>
          <h2 id="family-calendar-tasks" className="text-title-card text-text-primary">
            Tasks
          </h2>
          <p className="text-body-small text-text-secondary">{dateLabel}</p>
        </div>
        {occurrences.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No tasks on this day"
            body="Care events scheduled for this day will appear here."
          />
        ) : readOnly ? (
          <ul className="flex flex-col">
            {occurrences.map((occurrence) => (
              <li
                key={occurrence.key}
                className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1"
              >
                <span className="min-w-0 text-body-default text-text-primary [overflow-wrap:anywhere]">
                  {occurrence.title}
                </span>
                <StatusPill status={occurrence.status} actorName={occurrence.actor ?? "—"} />
              </li>
            ))}
          </ul>
        ) : (
          <TaskChecklist
            items={occurrences.map((occurrence) => ({
              id: occurrence.key,
              label: occurrence.title,
              checked: isTicked(occurrence),
            }))}
            onToggle={onToggle}
            className="flex flex-col [&_input]:ml-3 [&_input]:accent-primary [&_label]:gap-4 [&_span]:min-w-0 [&_span]:[overflow-wrap:anywhere]"
          />
        )}
        {/* On the page from the start so screen readers pick up what is announced. */}
        <p role="status" className="text-body-small text-text-alert-strong empty:hidden">
          {errorMessage}
        </p>
      </CardShell>
    </section>
  );
}
