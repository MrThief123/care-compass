import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MonthGrid } from "./month-grid";

describe("[UI-01] MonthGrid", () => {
  it("marks today, selected, has-events and out-of-month cell states", () => {
    render(
      <MonthGrid
        month="2026-11-15"
        today="2026-11-30"
        selected="2026-11-24"
        datesWithEvents={["2026-11-24", "2026-11-26"]}
      />,
    );

    expect(screen.getByTestId("month-grid-day-2026-11-30")).toHaveAttribute("aria-current", "date");
    expect(screen.getByTestId("month-grid-day-2026-11-24")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("month-grid-day-2026-11-26")).toHaveAttribute(
      "data-has-events",
      "true",
    );
    expect(screen.getByTestId("month-grid-day-2026-10-27")).toHaveAttribute(
      "data-in-month",
      "false",
    );
    expect(screen.getByTestId("month-grid-day-2026-11-27")).toHaveAttribute(
      "data-in-month",
      "true",
    );
  });

  it("calls onSelectDate with the clicked date", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<MonthGrid month="2026-11-15" onSelectDate={onSelectDate} />);

    await user.click(screen.getByTestId("month-grid-day-2026-11-24"));
    expect(onSelectDate).toHaveBeenCalledWith("2026-11-24");
  });
});
