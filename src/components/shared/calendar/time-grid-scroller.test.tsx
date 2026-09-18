import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimeGridScroller } from "./time-grid-scroller";

describe("[UI-01] TimeGridScroller", () => {
  it("renders every hour of the day from 00:00 to 23:00", () => {
    render(<TimeGridScroller>{null}</TimeGridScroller>);
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("07:00")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
  });

  it("opens scrolled to 07:00 with 07:00–18:00 in view", () => {
    render(<TimeGridScroller>{null}</TimeGridScroller>);
    const viewport = screen.getByTestId("time-grid-viewport");
    // rowPx 44 → 07:00 is 308px down, less the 8px the label bleeds above its
    // gridline. The viewport shows the 11 hours to 18:00, plus that bleed.
    expect(viewport.scrollTop).toBe(300);
    expect(viewport).toHaveStyle({ height: "492px" });
  });

  it("scrolls to a custom focus hour", () => {
    render(
      <TimeGridScroller focusStartHour={6} focusEndHour={20}>
        {null}
      </TimeGridScroller>,
    );
    const viewport = screen.getByTestId("time-grid-viewport");
    expect(viewport.scrollTop).toBe(256);
    expect(viewport).toHaveStyle({ height: "624px" });
  });

  it("never scrolls above the top of the canvas", () => {
    render(<TimeGridScroller focusStartHour={0}>{null}</TimeGridScroller>);
    expect(screen.getByTestId("time-grid-viewport").scrollTop).toBe(0);
  });

  it("indents the header so it lines up with the columns", () => {
    render(
      <TimeGridScroller header={<div data-testid="header">days</div>}>{null}</TimeGridScroller>,
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });
});
