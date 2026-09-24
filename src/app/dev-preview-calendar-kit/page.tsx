"use client";

/**
 * Dev-only preview harness for the UI-01 calendar kit. **Not a product screen.**
 *
 * It has no PRD entry, no acceptance criterion and no test of its own, and it
 * is not a template for the Family, Carer or Admin calendars — those compose
 * these components against real data through `src/server/**`, and nothing here
 * should be copied into them. Every occurrence it renders is synthetic (see
 * `./fixtures`); no client data ever belongs in this file.
 *
 * It exists because the kit's defects are visual, and the unit tests passed
 * green through every one of them: clipped rows, a missing ellipsis, mid-word
 * breaks, a type ramp that `cn` was silently deleting. jsdom cannot measure a
 * line box, so this page is the only place those are visible. It is kept for
 * exactly as long as that is true.
 *
 * **Delete this route** once a real screen renders `DayTimeline`, `WeekGrid`
 * and `MonthGrid` against `src/server/**` data — that screen becomes the
 * regression surface and this one stops being worth maintaining. UI-02 or the
 * Family Home calendar is the expected trigger. See DECISIONS.md FD-08 in
 * `docs/development/shared/shared-calendar-kit/`.
 */

import { useState } from "react";

import { CalendarHeader } from "@/components/shared/calendar/calendar-header";
import { DatePickerGrid } from "@/components/shared/calendar/date-picker-grid";
import { DayTimeline } from "@/components/shared/calendar/day-timeline";
import { MonthGrid } from "@/components/shared/calendar/month-grid";
import { WeekGrid } from "@/components/shared/calendar/week-grid";
import { DevPreviewNav } from "@/components/shared/dev-preview-nav";
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
      <DevPreviewNav />
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

      <p className="rounded-inset border border-border-default bg-bg-inset px-3 py-2 text-body-small text-text-secondary">
        Not a product screen. This route exists to render the shared calendar components for visual
        review, on synthetic fixtures only — never client data. It is deleted once a real screen
        renders the kit.
      </p>

      <p className="text-body-small text-text-secondary">
        Plain events (UI-05) — Short walk, Garden walk, Music in the lounge, Picnic in the park —
        have no status: a neutral grey stripe, no check or alert shape, and the word
        &ldquo;Event&rdquo;.
      </p>

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
