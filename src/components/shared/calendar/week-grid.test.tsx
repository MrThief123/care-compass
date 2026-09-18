import { render, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Occurrence } from "@/types/domain";

import { WeekGrid } from "./week-grid";

/** Thursday 09:30, 15 minutes — shorter than the readable minimum block. */
const WEIGH_IN: Occurrence = {
  key: "event-weigh-in:2026-12-03T09:30:00+11:00",
  eventId: "event-weigh-in",
  clientId: "client-margaret",
  title: "Weekly weigh-in",
  description: "",
  start: "2026-12-03T09:30:00+11:00",
  durationMinutes: 15,
  status: "planned",
};

/** Tuesday 09:00–10:00, overlaps PHYSIO. */
const MEDS: Occurrence = {
  key: "event-meds:2026-12-01T09:00:00+11:00",
  eventId: "event-meds",
  clientId: "client-margaret",
  title: "Morning medication",
  description: "Two tablets with breakfast",
  start: "2026-12-01T09:00:00+11:00",
  durationMinutes: 60,
  status: "done",
  actor: "Aisha Rahman",
  assignee: "Aisha Rahman",
};

/** Tuesday 09:30–11:30, overlaps MEDS. */
const PHYSIO: Occurrence = {
  key: "event-physio:2026-12-01T09:30:00+11:00",
  eventId: "event-physio",
  clientId: "client-margaret",
  title: "Physiotherapy",
  description: "",
  start: "2026-12-01T09:30:00+11:00",
  durationMinutes: 120,
  status: "planned",
  assignee: "Sarah Nguyen",
};

/** Monday 10:00–14:00 — 176px, deep enough for its long title to wrap. */
const DAY_PROGRAM: Occurrence = {
  key: "event-program:2026-11-30T10:00:00+11:00",
  eventId: "event-program",
  clientId: "client-margaret",
  title: "Community participation day program with the Thursday group",
  description: "",
  start: "2026-11-30T10:00:00+11:00",
  durationMinutes: 240,
  status: "planned",
  assignee: "Jordan Lee",
};

/** Wednesday 23:30 — runs past midnight, so it must be clamped to the canvas. */
const NIGHT_CHECK: Occurrence = {
  key: "event-night:2026-12-02T23:30:00+11:00",
  eventId: "event-night",
  clientId: "client-margaret",
  title: "Night check",
  description: "",
  start: "2026-12-02T23:30:00+11:00",
  durationMinutes: 60,
  status: "planned",
};

const OCCURRENCES: Occurrence[] = [WEIGH_IN, MEDS, PHYSIO, NIGHT_CHECK];

function block(occurrence: Occurrence): HTMLElement {
  return screen.getByTestId(`week-grid-block-${occurrence.key}`);
}

describe("[UI-01][AC-03] WeekGrid", () => {
  it("highlights today's column and places the occurrence under its day", () => {
    render(<WeekGrid weekStart="2026-11-30" today="2026-11-30" occurrences={[WEIGH_IN]} />);

    expect(screen.getByTestId("week-grid-header-2026-11-30")).toHaveAttribute(
      "aria-current",
      "date",
    );
    expect(screen.getByTestId("week-grid-header-2026-12-03")).not.toHaveAttribute("aria-current");

    const thursday = screen.getByTestId("week-grid-day-2026-12-03");
    expect(within(thursday).getByText("09:30")).toBeInTheDocument();
    expect(within(thursday).getByText("Weekly weigh-in")).toBeInTheDocument();
  });

  it("[AC-02] renders the whole day and opens on the 07:00–18:00 focus window", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[]} />);

    // Full-day canvas: every hour of the day can be scrolled to.
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
    // The viewport shows the focus window, (18 − 7) × 44 = 484px, plus the
    // 8px the hour label bleeds above its own gridline.
    expect(screen.getByTestId("time-grid-viewport")).toHaveStyle({ height: "492px" });
  });

  it("[AC-02] positions a block from the start of the day, not the focus hour", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[WEIGH_IN]} />);
    // 09:30 on a canvas starting at 00:00 → 9.5 × 44 = 418px.
    expect(block(WEIGH_IN)).toHaveStyle({ top: "418px" });
  });

  it("[AC-02] sizes a block's height in proportion to its duration", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={OCCURRENCES} />);
    // rowPx=44 → 60 min = 44px, 120 min = 88px.
    expect(block(MEDS)).toHaveStyle({ height: "44px" });
    expect(block(PHYSIO)).toHaveStyle({ height: "88px" });
  });

  it("[AC-02] clamps a short block to a readable minimum height", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[WEIGH_IN]} />);
    // 15 min would be 11px, which is unreadable and barely clickable; the
    // layout clamps it to the 22px minimum.
    expect(block(WEIGH_IN)).toHaveStyle({ height: "22px" });
  });

  it("[AC-02] never lets a block overflow the bottom of the canvas", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[NIGHT_CHECK]} />);
    const night = block(NIGHT_CHECK);
    // Canvas is 24 × 44 = 1056px; a 23:30 block starts at 1034px, so its
    // 44px duration height is cut to the 22px that remain.
    expect(night).toHaveStyle({ top: "1034px" });
    expect(night).toHaveStyle({ height: "22px" });
  });

  it("[AC-03] gives overlapping events side-by-side columns inside one day", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={OCCURRENCES} />);

    const tuesday = screen.getByTestId("week-grid-day-2026-12-01");
    expect(within(tuesday).getAllByRole("button")).toHaveLength(2);

    expect(block(MEDS)).toHaveStyle({ left: "calc(0% + 2px)", width: "calc(50% - 4px)" });
    expect(block(PHYSIO)).toHaveStyle({ left: "calc(50% + 2px)", width: "calc(50% - 4px)" });

    // A day with a single event still uses the full column width.
    expect(block(WEIGH_IN)).toHaveStyle({ left: "calc(0% + 2px)", width: "calc(100% - 4px)" });
  });

  it("[AC-03] shows a compact block's title with its start time inline", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[WEIGH_IN]} />);

    const compact = block(WEIGH_IN);
    expect(compact).toHaveAttribute("data-density", "compact");
    expect(within(compact).getByText("Weekly weigh-in")).toBeInTheDocument();
    expect(within(compact).getByText("09:30")).toBeInTheDocument();
    expect(within(compact).queryByText("09:30–09:45")).not.toBeInTheDocument();
  });

  it("[AC-03] shows a regular block's time range but not its assignee", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[MEDS]} />);

    const regular = block(MEDS);
    expect(regular).toHaveAttribute("data-density", "regular");
    expect(within(regular).getByText("Morning medication")).toBeInTheDocument();
    expect(within(regular).getByText("09:00–10:00")).toBeInTheDocument();
    expect(within(regular).queryByText("Aisha Rahman")).not.toBeInTheDocument();
  });

  it("[AC-03] shows a full block's title, time range and assignee", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[PHYSIO]} />);

    const full = block(PHYSIO);
    expect(full).toHaveAttribute("data-density", "full");
    expect(within(full).getByText("Physiotherapy")).toBeInTheDocument();
    expect(within(full).getByText("09:30–11:30")).toBeInTheDocument();
    expect(within(full).getByText("Sarah Nguyen")).toBeInTheDocument();
  });

  it("[AC-03] shows the detail card on hover", async () => {
    const user = userEvent.setup();
    render(<WeekGrid weekStart="2026-11-30" occurrences={OCCURRENCES} />);

    await user.hover(block(MEDS));

    const popover = await screen.findByTestId(`event-popover-${MEDS.key}`);
    // The detail the regular tier had no room for.
    expect(within(popover).getByText("Aisha Rahman")).toBeInTheDocument();
    expect(within(popover).getByText("Two tablets with breakfast")).toBeInTheDocument();
  });

  it("[AC-03] hides the detail card when the pointer leaves the block", async () => {
    const user = userEvent.setup();
    render(<WeekGrid weekStart="2026-11-30" occurrences={OCCURRENCES} />);

    await user.hover(block(WEIGH_IN));
    await screen.findByTestId(`event-popover-${WEIGH_IN.key}`);

    await user.unhover(block(WEIGH_IN));
    await waitForElementToBeRemoved(() => screen.queryByTestId(`event-popover-${WEIGH_IN.key}`));
  });

  it("[AC-03] shows the detail card on keyboard focus", async () => {
    const user = userEvent.setup();
    render(<WeekGrid weekStart="2026-11-30" occurrences={[WEIGH_IN]} />);

    block(WEIGH_IN).focus();

    const popover = await screen.findByTestId(`event-popover-${WEIGH_IN.key}`);
    expect(block(WEIGH_IN)).toHaveAttribute("aria-describedby", popover.id);
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId(`event-popover-${WEIGH_IN.key}`)).not.toBeInTheDocument();
  });

  it("[AC-03] reports the selection on click without leaving the card open", async () => {
    const user = userEvent.setup();
    const onSelectOccurrence = vi.fn();
    render(
      <WeekGrid
        weekStart="2026-11-30"
        occurrences={OCCURRENCES}
        onSelectOccurrence={onSelectOccurrence}
      />,
    );

    await user.click(block(MEDS));

    // Clicking an event opens it for editing (UI-02), not the hover card.
    expect(onSelectOccurrence).toHaveBeenCalledWith(MEDS);
    expect(screen.queryByTestId(`event-popover-${MEDS.key}`)).not.toBeInTheDocument();
  });

  it("[AC-03] draws the current-time line in today's column only", () => {
    render(
      <WeekGrid
        weekStart="2026-11-30"
        today="2026-12-01"
        occurrences={[]}
        now={new Date("2026-12-01T12:30:00+11:00")}
      />,
    );

    const tuesday = screen.getByTestId("week-grid-day-2026-12-01");
    expect(within(tuesday).getByTestId("current-time-line")).toHaveStyle({ top: "550px" });
    expect(screen.getAllByTestId("current-time-line")).toHaveLength(1);
    expect(screen.getByTestId("time-grid-now-label")).toHaveTextContent("12:30");
  });

  it("[AC-03] wraps a long title onto the lines the block's height affords", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[WEIGH_IN, MEDS, DAY_PROGRAM]} />);

    // 22px compact: the title shares its only line with the start time.
    expect(within(block(WEIGH_IN)).getByText("Weekly weigh-in")).toHaveAttribute(
      "data-title-lines",
      "1",
    );
    // 44px regular: the time range below it takes what is left.
    expect(within(block(MEDS)).getByText("Morning medication")).toHaveAttribute(
      "data-title-lines",
      "1",
    );
    // 176px full: room for every clamp the styles provide.
    expect(within(block(DAY_PROGRAM)).getByText(DAY_PROGRAM.title)).toHaveAttribute(
      "data-title-lines",
      "6",
    );
  });

  it("[AC-03] gives up title height, not the time range, when a row grows", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={[PHYSIO]} />);
    const full = block(PHYSIO);

    // Whatever height the assignee line actually takes, the title is the only
    // row allowed to lose one — never the time range.
    expect(within(full).getByText("09:30–11:30")).toHaveClass("shrink-0");
    expect(within(full).getByText("Sarah Nguyen")).toHaveClass("shrink-0");
    expect(within(full).getByText("Physiotherapy").parentElement).toHaveClass("min-h-0");
  });

  it("[AC-03] calls onSelectDay when a day header is clicked", async () => {
    const user = userEvent.setup();
    const onSelectDay = vi.fn();
    render(<WeekGrid weekStart="2026-11-30" occurrences={OCCURRENCES} onSelectDay={onSelectDay} />);

    await user.click(screen.getByTestId("week-grid-header-2026-12-03"));
    expect(onSelectDay).toHaveBeenCalledWith("2026-12-03");
  });

  it("formats block labels with the labelFormat prop when given", () => {
    render(
      <WeekGrid
        weekStart="2026-11-30"
        occurrences={[WEIGH_IN]}
        labelFormat={(o) => `Margaret — ${o.title.slice(0, 7)}…`}
      />,
    );

    expect(screen.getByText("Margaret — Weekly …")).toBeInTheDocument();
  });
});
