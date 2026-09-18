import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CurrentTimeLine } from "./current-time-line";

/** 12:30 Melbourne (AEST, +10:00 in September) → 12.5 × 44px = 550px down. */
const HALF_PAST_NOON = new Date("2026-09-18T12:30:00+10:00");

afterEach(() => {
  vi.useRealTimers();
});

describe("[UI-01] CurrentTimeLine", () => {
  it("sits at the current Melbourne wall-clock minute on the hour canvas", () => {
    render(<CurrentTimeLine now={HALF_PAST_NOON} />);
    expect(screen.getByTestId("current-time-line")).toHaveStyle({ top: "550px" });
  });

  it("is placed off the same rowPx the blocks use", () => {
    render(<CurrentTimeLine now={HALF_PAST_NOON} rowPx={100} />);
    expect(screen.getByTestId("current-time-line")).toHaveStyle({ top: "1250px" });
  });

  it("measures from the start of the canvas, not from midnight", () => {
    render(<CurrentTimeLine now={HALF_PAST_NOON} dayStartHour={8} />);
    // 12:30 is 4.5 hours into a canvas that opens at 08:00.
    expect(screen.getByTestId("current-time-line")).toHaveStyle({ top: "198px" });
  });

  it("draws nothing when the clock falls outside the rendered canvas", () => {
    render(<CurrentTimeLine now={HALF_PAST_NOON} dayStartHour={14} dayEndHour={24} />);
    expect(screen.queryByTestId("current-time-line")).not.toBeInTheDocument();
  });

  it("draws nothing when no clock is available", () => {
    render(<CurrentTimeLine now={null} />);
    expect(screen.queryByTestId("current-time-line")).not.toBeInTheDocument();
  });

  it("draws only on its own day, so a week grid marks today's column alone", () => {
    render(<CurrentTimeLine now={HALF_PAST_NOON} onDate="2026-09-18" />);
    expect(screen.getByTestId("current-time-line")).toBeInTheDocument();
  });

  it("draws nothing on a column that is not today", () => {
    render(<CurrentTimeLine now={HALF_PAST_NOON} onDate="2026-09-19" />);
    expect(screen.queryByTestId("current-time-line")).not.toBeInTheDocument();
  });

  it("is hidden from assistive technology, which reads the time elsewhere", () => {
    render(<CurrentTimeLine now={HALF_PAST_NOON} />);
    expect(screen.getByTestId("current-time-line")).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to the real clock when no time is passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(HALF_PAST_NOON);
    render(<CurrentTimeLine />);
    expect(screen.getByTestId("current-time-line")).toHaveStyle({ top: "550px" });
  });

  it("moves itself down as the clock advances", () => {
    vi.useFakeTimers();
    vi.setSystemTime(HALF_PAST_NOON);
    render(<CurrentTimeLine />);

    act(() => {
      vi.advanceTimersByTime(30 * 60_000);
    });

    // 13:00 → 13 × 44px.
    expect(screen.getByTestId("current-time-line")).toHaveStyle({ top: "572px" });
  });
});
