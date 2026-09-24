"use client";

import { TaskChecklist } from "@/components/shared/lists/task-checklist";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { Occurrence } from "@/types/domain";

export interface TasksPanelProps {
  /** "Monday 30 November". */
  dateLabel: string;
  occurrences: Occurrence[];
  isTicked: (occurrence: Occurrence) => boolean;
  onToggle: (key: string, ticked: boolean) => void;
}

/**
 * Tasks: the selected day's care events as a checklist. A tick is local state
 * only (Phase 1, CLAUDE.md §6) and is gone on reload; saving it is FAM-05.
 */
export function TasksPanel({ dateLabel, occurrences, isTicked, onToggle }: TasksPanelProps) {
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
        ) : (
          <TaskChecklist
            items={occurrences.map((occurrence) => ({
              id: occurrence.key,
              label: occurrence.title,
              checked: isTicked(occurrence),
            }))}
            onToggle={onToggle}
            className="flex flex-col [&_input]:m-3 [&_label]:gap-2 [&_span]:min-w-0 [&_span]:[overflow-wrap:anywhere]"
          />
        )}
      </CardShell>
    </section>
  );
}
