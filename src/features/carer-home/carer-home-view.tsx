import { melbourneDateTime } from "@/components/shared/calendar/melbourne-time";
import { NotificationRow } from "@/components/shared/lists/notification-row";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { CarerShiftRow } from "@/server/shifts/queries";
import type { CarerNotification } from "@/types/domain";

export interface CarerHomeViewProps {
  shifts: CarerShiftRow[];
  notifications: CarerNotification[];
}

/**
 * Carer · Home (CHG-025): today's shifts beside the carer's shift
 * notifications, where the design's Tasks card was. Stacks below 1024px.
 * Every grid item is `min-w-0`, so a long name or message wraps instead of
 * widening the page.
 */
export function CarerHomeView({ shifts, notifications }: CarerHomeViewProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section aria-labelledby="carer-home-today" className="min-w-0">
        <CardShell className="p-5">
          <h2 id="carer-home-today" className="text-title-card text-text-primary">
            Today&apos;s calendar
          </h2>
          {shifts.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No shifts today"
              body="Shifts assigned to you for today will appear here."
            />
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {shifts.map((shift) => (
                <li
                  key={shift.id}
                  className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-1 rounded-card border border-border-subtle px-5 py-4"
                >
                  <span className="text-body-emphasis text-text-primary tabular-nums">
                    {`${melbourneDateTime(shift.start).time}–${melbourneDateTime(shift.end).time}`}
                  </span>
                  <span className="min-w-0 break-words text-body-default text-text-primary">
                    {shift.clientFirstName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardShell>
      </section>
      <section aria-labelledby="carer-home-notifications" className="min-w-0">
        <CardShell className="p-5">
          <h2 id="carer-home-notifications" className="text-title-card text-text-primary">
            Notifications
          </h2>
          {notifications.length === 0 ? (
            <EmptyState
              icon="bell"
              title="No notifications"
              body="Changes to your shifts will appear here."
            />
          ) : (
            <ul className="mt-2">
              {notifications.map((notification) => (
                <li key={notification.id} className="min-w-0 break-words">
                  <NotificationRow source={notification.source} message={notification.message} />
                </li>
              ))}
            </ul>
          )}
        </CardShell>
      </section>
    </div>
  );
}
