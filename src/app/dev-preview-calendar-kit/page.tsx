"use client";

import { useState } from "react";

import { CalendarHeader } from "@/components/shared/calendar/calendar-header";
import { DatePickerGrid } from "@/components/shared/calendar/date-picker-grid";
import { DayTimeline } from "@/components/shared/calendar/day-timeline";
import { MonthGrid } from "@/components/shared/calendar/month-grid";
import { WeekGrid } from "@/components/shared/calendar/week-grid";
import { weekRange } from "@/lib/dates/week-range";

import {
  DAY_OCCURRENCES,
  MONTH,
  MONTH_OCCURRENCES,
  TODAY,
  WEEK_OCCURRENCES,
  WEEK_START,
} from "./fixtures";

type View = "day" | "week" | "month";

const VIEWS: { id: View; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export default function CalendarKitPreviewPage() {
  const [view, setView] = useState<View>("day");
  const [selected, setSelected] = useState(TODAY);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-title-page">Calendar kit preview (UI-01, dev only)</h1>
        <div className="flex gap-1 rounded-control bg-bg-inset p-1">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              aria-pressed={view === option.id}
              className={
                view === option.id
                  ? "rounded-control bg-bg-brand-deep px-4 py-2 text-body-emphasis text-text-on-dark"
                  : "rounded-control px-4 py-2 text-body-default text-text-secondary"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <CalendarHeader range={weekRange(TODAY)} />

      <section className="flex flex-col rounded-card border border-border-default p-3">
        {view === "day" && <DayTimeline occurrences={DAY_OCCURRENCES} />}
        {view === "week" && (
          <WeekGrid weekStart={WEEK_START} today={TODAY} occurrences={WEEK_OCCURRENCES} />
        )}
        {view === "month" && (
          <MonthGrid
            month={MONTH}
            today={TODAY}
            selected={selected}
            occurrences={MONTH_OCCURRENCES}
            onSelectDate={setSelected}
          />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-title-section">DatePickerGrid</h2>
        <div className="max-w-xs">
          <DatePickerGrid
            month={MONTH}
            selected={selected}
            datesWithItems={["2026-09-14", "2026-09-16", "2026-09-17"]}
            onSelect={setSelected}
          />
        </div>
      </section>
    </div>
  );
}
