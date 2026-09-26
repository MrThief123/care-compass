"use client";

import { useRouter } from "next/navigation";

import { useCurrentTime } from "@/components/shared/calendar/current-time-line";
import { DayTimeline } from "@/components/shared/calendar/day-timeline";
import { MonthGrid } from "@/components/shared/calendar/month-grid";
import { WeekGrid } from "@/components/shared/calendar/week-grid";
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
import type { PlainEventOccurrence } from "@/types/domain";

import { CarerCalendarToolbar } from "./carer-calendar-toolbar";

export interface CarerCalendarViewProps {
  today: LocalDate;
  params: CalendarParams;
  /** The carer's shifts on the visible days, earliest first. */
  shifts: CarerShiftRow[];
}

/** A shift drawn on the grids: a plain event titled with the client's first name (as Carer Home). */
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

const href = (params: CalendarParams) => `/carer/calendar?${calendarQuery(params)}`;

/**
 * Carer · Calendar (CAR-UI-03, CHG-030): the carer's shifts in D/W/M, with
 * Family · Calendar's URL state (`?view=&date=&month=`). Every change of view
 * or range navigates, so the server reads that range. A shift opens its
 * patient's page. No Tasks panel (CHG-025).
 */
export function CarerCalendarView({ today, params, shifts }: CarerCalendarViewProps) {
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
    <div className="flex min-w-0 flex-col gap-5 px-6 pb-6 pt-4">
      <CarerCalendarToolbar
        label={rangeLabel(params, range)}
        view={params.view}
        onViewChange={changeView}
        onStep={step}
        onToday={goToday}
      />

      <CardShell className="flex min-w-0 flex-col overflow-hidden p-0">
        {shifts.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No shifts"
            body="Shifts assigned to you will appear here."
          />
        ) : (
          <>
            {params.view === "week" && (
              <WeekGrid
                weekStart={range.from}
                today={today}
                occurrences={occurrences}
                now={now}
                onSelectOccurrence={openPatient}
              />
            )}
            {params.view === "day" && (
              <DayTimeline
                occurrences={occurrences}
                now={now}
                onSelect={openPatient}
                className="px-2"
              />
            )}
            {params.view === "month" && (
              <MonthGrid
                month={`${params.month}-01`}
                today={today}
                occurrences={occurrences}
                className="p-3"
              />
            )}
          </>
        )}
      </CardShell>
    </div>
  );
}
