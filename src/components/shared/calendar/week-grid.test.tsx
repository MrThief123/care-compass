import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Occurrence } from "@/types/domain";

import { WeekGrid } from "./week-grid";

const OCCURRENCES: Occurrence[] = [
  {
    key: "event-weigh-in:2026-12-03T09:30:00+11:00",
    eventId: "event-weigh-in",
    clientId: "client-margaret",
    title: "Weekly weigh-in",
    description: "",
    start: "2026-12-03T09:30:00+11:00",
    durationMinutes: 15,
    status: "planned",
  },
];

describe("[UI-01][AC-03] WeekGrid", () => {
  it("highlights today's column and places the occurrence under its day", () => {
    render(<WeekGrid weekStart="2026-11-30" today="2026-11-30" occurrences={OCCURRENCES} />);

    expect(screen.getByRole("columnheader", { name: /MON\s*30/ })).toHaveAttribute(
      "aria-current",
      "date",
    );
    expect(screen.getByRole("columnheader", { name: /THU\s*3/ })).not.toHaveAttribute(
      "aria-current",
    );

    const thursday = screen.getByTestId("week-grid-day-2026-12-03");
    expect(within(thursday).getByText("09:30 Weekly weigh-in")).toBeInTheDocument();
  });

  it("formats block labels with the labelFormat prop when given", () => {
    render(
      <WeekGrid
        weekStart="2026-11-30"
        occurrences={OCCURRENCES}
        labelFormat={(o) => `Margaret — ${o.title.slice(0, 7)}…`}
      />,
    );

    expect(screen.getByText("Margaret — Weekly …")).toBeInTheDocument();
  });
});
