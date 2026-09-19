import { DayTimeline } from "@/components/shared/calendar/day-timeline";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { Occurrence } from "@/types/domain";

export interface TodayPanelProps {
  occurrences: Occurrence[];
  /** Short date for the caption, e.g. "Mon 30 Nov". */
  dateLabel: string;
}

/** The Today panel: today's occurrences on the shared day timeline. */
export function TodayPanel({ occurrences, dateLabel }: TodayPanelProps) {
  return (
    <section aria-labelledby="family-home-today" className="flex min-w-0 flex-1">
      <CardShell className="min-w-0 flex-1 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 id="family-home-today" className="text-title-section text-text-primary">
            Today
          </h2>
          <p className="text-body-small text-text-secondary">{`${dateLabel} · day view`}</p>
        </div>
        {occurrences.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No care events today"
            body="Events scheduled for today will appear here."
          />
        ) : (
          <DayTimeline occurrences={occurrences} className="mt-2" />
        )}
      </CardShell>
    </section>
  );
}
