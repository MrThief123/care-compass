import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Occurrence } from "@/types/domain";

import { DayTimeline } from "./day-timeline";

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
  {
    key: "event-walk:2026-11-30T14:00:00+11:00",
    eventId: "event-walk",
    clientId: "client-margaret",
    title: "Afternoon walk",
    description: "",
    start: "2026-11-30T14:00:00+11:00",
    durationMinutes: 45,
    status: "planned",
    assignee: "Sarah Nguyen",
  },
];

describe("[UI-01] DayTimeline", () => {
  it("renders an hour gutter from 07:00 to 18:00", () => {
    render(<DayTimeline occurrences={[]} />);
    expect(screen.getByText("07:00")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.queryByText("06:00")).not.toBeInTheDocument();
    expect(screen.queryByText("19:00")).not.toBeInTheDocument();
  });

  it("renders each occurrence's title, assignee, duration and status pill", () => {
    render(<DayTimeline occurrences={OCCURRENCES} />);

    const morning = screen.getByTestId("day-timeline-block-event-meds:2026-11-30T09:00:00+11:00");
    expect(within(morning).getByText("Morning medication")).toBeInTheDocument();
    expect(within(morning).getByText("Aisha Rahman")).toBeInTheDocument();
    expect(within(morning).getByText("30 min")).toBeInTheDocument();
    expect(within(morning).getByText("Done · Aisha Rahman")).toBeInTheDocument();

    const afternoon = screen.getByTestId("day-timeline-block-event-walk:2026-11-30T14:00:00+11:00");
    expect(within(afternoon).getByText("Afternoon walk")).toBeInTheDocument();
    expect(within(afternoon).getByText("45 min")).toBeInTheDocument();
    expect(within(afternoon).getByText("Planned")).toBeInTheDocument();
  });

  it("positions the 09:00 block 88px from the top of the grid by default", () => {
    render(<DayTimeline occurrences={OCCURRENCES} />);
    const morning = screen.getByTestId("day-timeline-block-event-meds:2026-11-30T09:00:00+11:00");
    expect(morning).toHaveStyle({ top: "88px" });
  });
});
