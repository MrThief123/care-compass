"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCurrentTime } from "@/components/shared/calendar/current-time-line";
import { DayTimeline } from "@/components/shared/calendar/day-timeline";
import { MonthGrid } from "@/components/shared/calendar/month-grid";
import { WeekGrid } from "@/components/shared/calendar/week-grid";
import { CardShell } from "@/components/ui/card-shell";
import { addEventHrefFrom } from "@/features/family-event-form/event-form-return";
import { taskDetailHrefFrom } from "@/features/family-task-detail/task-detail-origin";
import type { LocalDate } from "@/lib/dates/week-range";
import { setOccurrenceDone, setOccurrenceUndone } from "@/server/events/actions";
import type { ClientShift } from "@/server/events/queries";
import type { AnyOccurrence, Occurrence } from "@/types/domain";

import { applyTick } from "./apply-ticks";
import { dayHeading, melbourneDay, rangeLabel } from "./calendar-format";
import {
  calendarHref,
  goToToday,
  selectDate,
  stepCalendar,
  switchView,
  visibleRange,
  type CalendarParams,
  type CalendarView,
} from "./calendar-params";
import { CalendarToolbar } from "./calendar-toolbar";
import { LogPanel } from "./log-panel";
import { OnDutyPanel } from "./on-duty-panel";
import { isShiftEntry, shiftsAsEntries } from "./shift-occurrences";
import { TasksPanel } from "./tasks-panel";
import { useCalendarShortcuts } from "./use-calendar-shortcuts";

export interface FamilyCalendarViewProps {
  clientId: string;
  today: LocalDate;
  params: CalendarParams;
  /** Every occurrence on the visible days, oldest first. */
  occurrences: Occurrence[];
  /** Latest done or overdue tasks, newest first. */
  log: Occurrence[];
  /** Carers on duty in the visible range; the On duty panel shows the selected day's. */
  shifts?: ClientShift[];
  /** The signed-in person, shown on a task they tick (CHG-016). */
  actorName: string;
  /** Where the links go; defaults to `/family/<id>`. A carer's Calendar sets it (CHG-043). */
  basePath?: string;
  /** False: the Tasks panel lists each task's status with no tick boxes (carer off shift). */
  canTick?: boolean;
  /** False: no Enter event link (carers, CHG-043). */
  canAddEvent?: boolean;
}

/**
 * Family · Calendar (FAM-UI-02): D/W/M grid, the selected day's Tasks and the
 * Log. View, range and selected day live in the URL (`calendar-params.ts`).
 * Changing view or range navigates, so the server reads that range. Picking a
 * day inside the range only rewrites the URL (`history.replaceState`, which the
 * Next.js router syncs with), because its data is already on screen. Ticks are
 * local and survive both, until a reload. The grids draw them too, with the
 * signed-in person as the actor (CHG-016, `apply-ticks.ts`); nothing is saved.
 */
export function FamilyCalendarView({
  clientId,
  today,
  params,
  occurrences: loaded,
  log,
  shifts = [],
  actorName,
  basePath,
  canTick = true,
  canAddEvent = true,
}: FamilyCalendarViewProps) {
  const router = useRouter();
  const range = visibleRange(params);
  const paramsHref = calendarHref(clientId, params, basePath);

  // The selected day follows the URL the server rendered, and a click moves it
  // locally. Reset when a navigation brings new params (React "adjust state on
  // prop change" pattern, no effect needed).
  const [selection, setSelection] = useState({ source: paramsHref, date: params.date });
  if (selection.source !== paramsHref) {
    setSelection({ source: paramsHref, date: params.date });
  }
  const selected = selection.source === paramsHref ? selection.date : params.date;

  // The kit labels the time in the gutter whatever week is shown, so the clock
  // is passed only while the real day is on screen (DECISIONS.md FD-07).
  const clock = useCurrentTime();
  const clockDay = clock ? melbourneDay(clock.toISOString()) : undefined;
  const now = clockDay && clockDay >= range.from && clockDay <= range.to ? clock : null;

  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  // FAM-05 AC-02: the last tick or untick's save error, if any (cleared on the next attempt).
  const [tickError, setTickError] = useState<string | undefined>(undefined);
  const occurrences = loaded.map((occurrence) =>
    applyTick(occurrence, ticks[occurrence.key], actorName),
  );

  // FAM-05: applies the tick at once (CHG-016), then saves it; a failed save reverts the
  // checkbox and shows an inline error (AC-02), same as the design's PROPOSED copy.
  async function toggleTick(key: string, ticked: boolean) {
    setTickError(undefined);
    setTicks((previous) => ({ ...previous, [key]: ticked }));
    const result = ticked ? await setOccurrenceDone(key) : await setOccurrenceUndone(key);
    if (!result.ok) {
      setTicks((previous) => ({ ...previous, [key]: !ticked }));
      setTickError(result.error.message);
    }
  }

  const navigate = (next: CalendarParams) => router.push(calendarHref(clientId, next, basePath));

  function select(date: LocalDate) {
    setSelection({ source: paramsHref, date });
    window.history.replaceState(
      null,
      "",
      calendarHref(clientId, selectDate(params, date), basePath),
    );
  }

  const current: CalendarParams = { ...params, date: selected };
  // A task opened here remembers this view and day, so Task detail's Back returns to them (CHG-014).
  const openOccurrence = (occurrence: AnyOccurrence) => {
    if (isShiftEntry(occurrence)) return;
    router.push(
      taskDetailHrefFrom(clientId, occurrence.key, { from: "calendar", view: current }, basePath),
    );
  };
  // The grids also draw who is on duty, as blocks beside the care events.
  const gridOccurrences: AnyOccurrence[] = [...occurrences, ...shiftsAsEntries(shifts, clientId)];
  const dayOccurrences = occurrences.filter(
    (occurrence) => melbourneDay(occurrence.start) === selected,
  );

  const changeView = (view: CalendarView) => {
    if (view !== params.view) navigate(switchView(current, view));
  };
  const step = (direction: -1 | 1) => navigate(stepCalendar(current, direction));
  // Today already on screen: select it without asking the server again.
  const goToday = () => {
    const next = goToToday(current, today);
    const nextRange = visibleRange(next);
    if (nextRange.from === range.from && nextRange.to === range.to) select(today);
    else navigate(next);
  };
  useCalendarShortcuts({ onViewChange: changeView, onStep: step, onToday: goToday });

  return (
    <div className="flex min-w-0 flex-col gap-5 px-6 pb-6 pt-4">
      <CalendarToolbar
        label={rangeLabel(params, range)}
        view={params.view}
        onViewChange={changeView}
        onStep={step}
        onToday={goToday}
        enterEventHref={
          canAddEvent
            ? addEventHrefFrom(clientId, { from: "calendar", view: current }, basePath)
            : undefined
        }
      />

      <CardShell className="flex min-w-0 flex-col overflow-hidden p-0">
        {params.view === "week" && (
          <WeekGrid
            weekStart={range.from}
            today={today}
            occurrences={gridOccurrences}
            now={now}
            onSelectDay={select}
            onSelectOccurrence={openOccurrence}
          />
        )}
        {params.view === "day" && (
          <DayTimeline
            occurrences={gridOccurrences}
            now={now}
            onSelect={openOccurrence}
            className="px-2"
          />
        )}
        {params.view === "month" && (
          <MonthGrid
            month={`${params.month}-01`}
            today={today}
            selected={selected}
            occurrences={gridOccurrences}
            onSelectDate={select}
            className="p-3"
          />
        )}
      </CardShell>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TasksPanel
          dateLabel={dayHeading(selected)}
          occurrences={dayOccurrences}
          isTicked={(occurrence) => ticks[occurrence.key] ?? occurrence.status === "done"}
          onToggle={toggleTick}
          errorMessage={tickError}
          readOnly={!canTick}
        />
        <div className="flex min-w-0 flex-col gap-5">
          <OnDutyPanel dateLabel={dayHeading(selected)} date={selected} shifts={shifts} />
          <LogPanel clientId={clientId} occurrences={log} calendar={current} basePath={basePath} />
        </div>
      </div>
    </div>
  );
}
