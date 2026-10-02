import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DatePickerGrid } from "./date-picker-grid";

afterEach(() => vi.useRealTimers());

describe("[FAM-16][AC-05] DatePickerGrid rings today", () => {
  it("[FAM-16][AC-05] marks the given day, and only that day, with aria-current and a ring", () => {
    render(<DatePickerGrid month="2026-11-15" selected="2026-11-30" today="2026-11-24" />);

    const today = screen.getByTestId("date-picker-day-2026-11-24");
    expect(today).toHaveAttribute("aria-current", "date");
    expect(today).toHaveAttribute("data-today", "true");
    expect(today.className).toMatch(/ring/);
    expect(screen.getByTestId("date-picker-day-2026-11-25")).not.toHaveAttribute("aria-current");
    expect(document.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  });

  it("[FAM-16][AC-05] with no `today` prop it uses today's Melbourne date", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-24T23:30:00Z")); // 10:30 on the 25th in Melbourne

    render(<DatePickerGrid month="2026-11-15" />);

    expect(screen.getByTestId("date-picker-day-2026-11-25")).toHaveAttribute(
      "aria-current",
      "date",
    );
    expect(screen.getByTestId("date-picker-day-2026-11-24")).not.toHaveAttribute("aria-current");
  });

  it("[FAM-16][AC-05] no ring when today is not in the shown grid, and a selected today keeps its fill", () => {
    const { rerender } = render(<DatePickerGrid month="2027-03-01" today="2026-11-24" />);
    expect(document.querySelectorAll('[aria-current="date"]')).toHaveLength(0);

    rerender(<DatePickerGrid month="2026-11-15" selected="2026-11-24" today="2026-11-24" />);
    const day = screen.getByTestId("date-picker-day-2026-11-24");
    expect(day).toHaveAttribute("aria-pressed", "true");
    expect(day.className).toMatch(/bg-primary/);
    expect(day).toHaveAttribute("aria-current", "date");
  });
});
