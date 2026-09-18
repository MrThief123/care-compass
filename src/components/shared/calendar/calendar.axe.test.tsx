import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { Occurrence } from "@/types/domain";

import { CalendarHeader } from "./calendar-header";
import { DatePickerGrid } from "./date-picker-grid";
import { DayTimeline } from "./day-timeline";
import { MonthGrid } from "./month-grid";
import { WeekGrid } from "./week-grid";

const OCCURRENCES: Occurrence[] = [
  {
    key: "event-meds:2026-11-30T09:00:00+11:00",
    eventId: "event-meds",
    clientId: "client-margaret",
    title: "Morning medication",
    description: "",
    start: "2026-11-30T09:00:00+11:00",
    durationMinutes: 30,
    status: "done",
    actor: "Aisha Rahman",
    assignee: "Aisha Rahman",
  },
];

describe("[UI-01][AC-06] calendar kit accessibility", () => {
  it("DayTimeline has no axe violations", async () => {
    const { container } = render(<DayTimeline occurrences={OCCURRENCES} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("WeekGrid has no axe violations", async () => {
    const { container } = render(
      <WeekGrid weekStart="2026-11-30" today="2026-11-30" occurrences={OCCURRENCES} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("MonthGrid has no axe violations", async () => {
    const { container } = render(
      <MonthGrid
        month="2026-11-15"
        today="2026-11-30"
        selected="2026-11-24"
        occurrences={OCCURRENCES}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CalendarHeader has no axe violations", async () => {
    const { container } = render(
      <CalendarHeader range={{ start: "2026-11-30", end: "2026-12-06" }} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("DatePickerGrid has no axe violations", async () => {
    const { container } = render(
      <DatePickerGrid month="2026-11-15" selected="2026-11-30" datesWithItems={["2026-11-24"]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
