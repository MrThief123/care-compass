"use client";

import { useRouter } from "next/navigation";

import { useCurrentTime } from "@/components/shared/calendar/current-time-line";
import { DayTimeline } from "@/components/shared/calendar/day-timeline";
import { MonthGrid } from "@/components/shared/calendar/month-grid";
import { WeekGrid } from "@/components/shared/calendar/week-grid";
import { NotificationRow } from "@/components/shared/lists/notification-row";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { rangeLabel } from "@/features/family-calendar/calendar-format";
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
import { instantToMelbourneLocal, localToMelbourneIso } from "@/lib/dates/melbourne-time";
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

  // The red line (AC-11, FD-06): the current Melbourne time drawn on the app's
  // today, which is the real day except in the mock (Mon 30 Nov 2026). The kit
  // labels the time in the gutter whatever week is shown, so it is passed only
  // while today is on screen.
  // ponytail: a tab left open past midnight keeps the old today until the next navigation.
  const clock = useCurrentTime();
  const now =
    clock && today >= range.from && today <= range.to
      ? new Date(
          localToMelbourneIso(
            `${today}T${instantToMelbourneLocal(clock.toISOString()).slice(11, 16)}`,
          ),
        )
      : null;

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
            {shifts.length === 0 && (
              // The grid stays, so the line and the hours still show on an empty range.
              <p className="shrink-0 pb-3 text-body-secondary text-text-secondary">
                <span className="text-body-emphasis text-text-primary">No shifts</span> · Shifts
                assigned to you will appear here.
              </p>
            )}
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
