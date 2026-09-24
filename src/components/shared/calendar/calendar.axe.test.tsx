import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { AnyOccurrence, Occurrence } from "@/types/domain";

import { CalendarHeader } from "./calendar-header";
import { DatePickerGrid } from "./date-picker-grid";
import { DayTimeline } from "./day-timeline";
import { EventPopover } from "./event-popover";
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

const WITH_PLAIN_EVENTS: AnyOccurrence[] = [
  ...OCCURRENCES,
  {
    key: "event-walk:2026-11-30T12:00:00+11:00",
    eventId: "event-walk",
    clientId: "client-margaret",
    title: "Afternoon walk",
    description: "Around the block",
    start: "2026-11-30T12:00:00+11:00",
    durationMinutes: 120,
    assignee: "Aisha Rahman",
    kind: "event",
  },
  {
    key: "event-garden:2026-11-30T15:00:00+11:00",
    eventId: "event-garden",
    clientId: "client-margaret",
    title: "Garden time",
    description: "",
    start: "2026-11-30T15:00:00+11:00",
    durationMinutes: 30,
    kind: "event",
  },
];

describe("[UI-05][AC-12] calendar kit accessibility with plain events", () => {
  it("[UI-05][AC-12] DayTimeline with plain events has no axe violations", async () => {
    const { container } = render(<DayTimeline occurrences={WITH_PLAIN_EVENTS} now={null} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[UI-05][AC-12] WeekGrid with plain events has no axe violations", async () => {
    const { container } = render(
      <WeekGrid
        weekStart="2026-11-30"
        today="2026-11-30"
        occurrences={WITH_PLAIN_EVENTS}
        now={null}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[UI-05][AC-12] MonthGrid with plain events has no axe violations", async () => {
    const { container } = render(
      <MonthGrid month="2026-11-15" today="2026-11-30" occurrences={WITH_PLAIN_EVENTS} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[UI-05][AC-12] EventPopover for a plain event has no axe violations", async () => {
    const anchor = document.createElement("button");
    anchor.textContent = "Afternoon walk";
    document.body.append(anchor);
    render(
      <EventPopover
        id="walk-detail"
        occurrence={WITH_PLAIN_EVENTS[1] as AnyOccurrence}
        anchor={anchor}
        onClose={() => {}}
      />,
    );
    expect(await axe(screen.getByRole("tooltip"))).toHaveNoViolations();
    anchor.remove();
  });
});
