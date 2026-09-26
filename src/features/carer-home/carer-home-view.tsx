"use client";

import { useRouter } from "next/navigation";

import { useCurrentTime } from "@/components/shared/calendar/current-time-line";
import { DayTimeline } from "@/components/shared/calendar/day-timeline";
import { MonthGrid } from "@/components/shared/calendar/month-grid";
import { WeekGrid } from "@/components/shared/calendar/week-grid";
import { NotificationRow } from "@/components/shared/lists/notification-row";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { melbourneDay, rangeLabel } from "@/features/family-calendar/calendar-format";
import {
  calendarQuery,
  goToToday,
  stepCalendar,
  switchView,
  visibleRange,
  type CalendarParams,
  type CalendarView,
} from "@/features/family-calendar/calendar-params";
import { useCalendarShortcuts } from "@/features/family-calendar/use-calendar-shortcuts";
import type { LocalDate } from "@/lib/dates/week-range";
import type { CarerShiftRow } from "@/server/shifts/queries";
import type { CarerNotification, PlainEventOccurrence } from "@/types/domain";

import { CarerShiftsToolbar } from "./carer-shifts-toolbar";

export interface CarerHomeViewProps {
  today: LocalDate;
  params: CalendarParams;
  /** The carer's shifts on the visible days, earliest first. */
  shifts: CarerShiftRow[];
  notifications: CarerNotification[];
}

/** A shift drawn on the calendar: a plain event titled with the client's first name. */
function toCalendarEvent(shift: CarerShiftRow): PlainEventOccurrence {
  return {
    kind: "event",
    key: shift.id,
    eventId: shift.id,
    clientId: shift.clientId,
    title: shift.clientFirstName,
    description: "",
    start: shift.start,
    durationMinutes: (Date.parse(shift.end) - Date.parse(shift.start)) / 60_000,
  };
}

/**
 * Day and Week fill the calendar box (CHG-031, FD-05): the kit sizes their
 * scroll viewport inline to the focus hours, so the override is `!important`.
 */
const FILL_TIME_GRID =
  "min-h-0 flex-1 [&>div:last-child]:h-auto! [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1";

const href = (params: CalendarParams) => `/carer/home?${calendarQuery(params)}`;

/**
 * Carer · Home (CHG-025, CHG-031): the carer's shifts in D/W/M (Day by
 * default), with Family · Calendar's URL state (`?view=&date=&month=`), beside
 * the carer's shift notifications. Every change of view or range navigates, so
 * the server reads that range; a shift opens its patient's page. Notifications
 * sit to the right from 1280px and below the calendar under that, so the week
 * grid keeps its width. Day, Week and Month share one 640px box, and the
 * Notifications list scrolls inside a card as tall as the calendar's (from
 * 1280px; 640px tall below that). Every grid item is `min-w-0`, so a long name or
 * message wraps instead of widening the page.
 */
export function CarerHomeView({ today, params, shifts, notifications }: CarerHomeViewProps) {
  const router = useRouter();
  const range = visibleRange(params);
  const occurrences = shifts.map(toCalendarEvent);

  // The kit labels the time in the gutter whatever week is shown, so the clock
  // is passed only while the real day is on screen (as Family, FD-07 there).
  const clock = useCurrentTime();
  const clockDay = clock ? melbourneDay(clock.toISOString()) : undefined;
  const now = clockDay && clockDay >= range.from && clockDay <= range.to ? clock : null;

  const navigate = (next: CalendarParams) => router.push(href(next));
  const openPatient = (occurrence: PlainEventOccurrence) =>
    router.push(`/carer/patients/${encodeURIComponent(occurrence.clientId)}`);
  const changeView = (view: CalendarView) => {
    if (view !== params.view) navigate(switchView(params, view));
  };
  const step = (direction: -1 | 1) => navigate(stepCalendar(params, direction));
  const goToday = () => navigate(goToToday(params, today));
  useCalendarShortcuts({ onViewChange: changeView, onStep: step, onToday: goToday });

  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 px-6 py-5 xl:items-stretch xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section aria-labelledby="carer-home-shifts" className="min-w-0">
        <CardShell className="flex min-w-0 flex-col gap-4 overflow-hidden p-5">
          <CarerShiftsToolbar
            headingId="carer-home-shifts"
            label={rangeLabel(params, range)}
            view={params.view}
            onViewChange={changeView}
            onStep={step}
            onToday={goToday}
          />
          <div className="flex h-[640px] min-h-0 flex-col">
            {shifts.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No shifts"
                body="Shifts assigned to you will appear here."
              />
            ) : (
              <>
                {params.view === "day" && (
                  <DayTimeline
                    occurrences={occurrences}
                    now={now}
                    onSelect={openPatient}
                    className={FILL_TIME_GRID}
                  />
                )}
                {params.view === "week" && (
                  <WeekGrid
                    weekStart={range.from}
                    today={today}
                    occurrences={occurrences}
                    now={now}
                    onSelectOccurrence={openPatient}
                    className={FILL_TIME_GRID}
                  />
                )}
                {params.view === "month" && (
                  <MonthGrid
                    month={`${params.month}-01`}
                    today={today}
                    occurrences={occurrences}
                    maxChipsPerDay={3}
                    className="[&>div:not(:first-child)]:min-h-0"
                  />
                )}
              </>
            )}
          </div>
        </CardShell>
      </section>
      <section aria-labelledby="carer-home-notifications" className="min-w-0">
        <CardShell className="flex h-full min-w-0 flex-col p-5">
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
            <ul
              aria-labelledby="carer-home-notifications"
              // Focusable so a keyboard can scroll it (axe scrollable-region-focusable).
              tabIndex={0}
              className="mt-2 max-h-[640px] min-h-0 flex-1 overflow-y-auto rounded-inset outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 xl:max-h-none xl:contain-size"
            >
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
