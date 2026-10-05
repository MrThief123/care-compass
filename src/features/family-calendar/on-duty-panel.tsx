import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { melbourneDay } from "@/features/family-calendar/calendar-format";
import type { ClientShift } from "@/server/events/queries";

export interface OnDutyPanelProps {
  /** "Monday 30 November". */
  dateLabel: string;
  /** The selected Melbourne day, "YYYY-MM-DD". */
  date: string;
  /** Shifts in the visible range; the panel keeps those that touch `date`. */
  shifts: ClientShift[];
}

const TIME = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "8:00 am – 12:00 pm" in Melbourne time. */
export function shiftTimes(shift: Pick<ClientShift, "start" | "end">): string {
  return `${TIME.format(new Date(shift.start))} – ${TIME.format(new Date(shift.end))}`;
}

/** On duty: the carers whose shifts with this client touch the selected day. */
export function OnDutyPanel({ dateLabel, date, shifts }: OnDutyPanelProps) {
  const onDay = shifts.filter(
    (shift) => melbourneDay(shift.start) <= date && melbourneDay(shift.end) >= date,
  );

  return (
    <section aria-labelledby="family-calendar-on-duty" className="min-w-0">
      <CardShell className="flex flex-col gap-2 px-5 py-4">
        <div>
          <h2 id="family-calendar-on-duty" className="text-title-card text-text-primary">
            On duty
          </h2>
          <p className="text-body-small text-text-secondary">{dateLabel}</p>
        </div>
        {onDay.length === 0 ? (
          <EmptyState
            icon="person"
            title="No carer on duty"
            body="No shifts are scheduled for this day."
          />
        ) : (
          <ul>
            {onDay.map((shift) => (
              <li
                key={shift.id}
                className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1"
              >
                <span className="min-w-0 text-body-emphasis text-text-primary [overflow-wrap:anywhere]">
                  {shift.carerName}
                </span>
                <span className="text-body-small text-text-secondary">{shiftTimes(shift)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardShell>
    </section>
  );
}
