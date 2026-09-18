import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DatePickerGrid } from "./date-picker-grid";

describe("[UI-01][AC-04] DatePickerGrid", () => {
  it("shows dots on days with items and fills the selected day", () => {
    render(
      <DatePickerGrid
        month="2026-11-15"
        selected="2026-11-30"
        datesWithItems={["2026-11-24", "2026-11-26", "2026-11-27"]}
      />,
    );

    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByTestId("date-picker-day-2026-11-24")).toHaveAttribute(
      "data-has-items",
      "true",
    );
    expect(screen.getByTestId("date-picker-day-2026-11-26")).toHaveAttribute(
      "data-has-items",
      "true",
    );
    expect(screen.getByTestId("date-picker-day-2026-11-27")).toHaveAttribute(
      "data-has-items",
      "true",
    );
    expect(screen.getByTestId("date-picker-day-2026-11-25")).toHaveAttribute(
      "data-has-items",
      "false",
    );
    expect(screen.getByTestId("date-picker-day-2026-11-30")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("mutes out-of-month days", () => {
    render(<DatePickerGrid month="2026-11-15" />);
    expect(screen.getByTestId("date-picker-day-2026-10-26")).toHaveAttribute(
      "data-in-month",
      "false",
    );
  });
});
