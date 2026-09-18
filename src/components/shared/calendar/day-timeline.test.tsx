import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Occurrence } from "@/types/domain";

import { DayTimeline } from "./day-timeline";

/** 30 min → 22px at the default 44px rows: the `compact` density tier. */
const MORNING: Occurrence = {
  key: "event-meds:2026-11-30T09:00:00+11:00",
  eventId: "event-meds",
  clientId: "client-margaret",
  title: "Morning medication",
  description: "Two tablets with breakfast",
  start: "2026-11-30T09:00:00+11:00",
  durationMinutes: 30,
  status: "done",
  actor: "Aisha Rahman",
  assignee: "Aisha Rahman",
};

/** 45 min → 33px: still the `compact` tier — two lines need 40px. */
const AFTERNOON: Occurrence = {
  key: "event-walk:2026-11-30T14:00:00+11:00",
  eventId: "event-walk",
  clientId: "client-margaret",
  title: "Afternoon walk",
  description: "",
  start: "2026-11-30T14:00:00+11:00",
  durationMinutes: 45,
  status: "planned",
  assignee: "Sarah Nguyen",
};

/** 90 min → 66px: the `regular` density tier. */
const PHYSIO: Occurrence = {
  key: "event-physio:2026-11-30T11:00:00+11:00",
  eventId: "event-physio",
  clientId: "client-margaret",
  title: "Physiotherapy",
  description: "Mobility exercises",
  start: "2026-11-30T11:00:00+11:00",
  durationMinutes: 90,
  status: "planned",
  assignee: "Sarah Nguyen",
};

/** 120 min → 88px: the `full` density tier. */
const OUTING: Occurrence = {
  key: "event-outing:2026-11-30T15:00:00+11:00",
  eventId: "event-outing",
  clientId: "client-margaret",
  title: "Community access",
  description: "",
  start: "2026-11-30T15:00:00+11:00",
  durationMinutes: 120,
  status: "planned",
  assignee: "Jordan Lee",
};

/** 23:30 + 60 min would run past midnight, off the bottom of the canvas. */
const LATE: Occurrence = {
  key: "event-settle:2026-11-30T23:30:00+11:00",
  eventId: "event-settle",
  clientId: "client-margaret",
  title: "Settling routine",
  description: "",
  start: "2026-11-30T23:30:00+11:00",
  durationMinutes: 60,
  status: "planned",
  assignee: "Sarah Nguyen",
};

const OCCURRENCES: Occurrence[] = [MORNING, AFTERNOON];

function blockFor(occurrence: Occurrence): HTMLElement {
  return screen.getByTestId(`day-timeline-block-${occurrence.key}`);
}

describe("[UI-01] DayTimeline", () => {
  it("renders the whole day so any hour can be scrolled to", () => {
    render(<DayTimeline occurrences={[]} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("06:00")).toBeInTheDocument();
    expect(screen.getByText("07:00")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.getByText("19:00")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
  });

  it("opens centred on the 07:00–18:00 focus window", () => {
    render(<DayTimeline occurrences={[]} />);
    const viewport = screen.getByTestId("time-grid-viewport");
    // rowPx 44 → 07:00 is 308px down the 24-hour canvas, less the 8px the
    // hour label bleeds above its own gridline; 11 hours are in view.
    expect(viewport.scrollTop).toBe(300);
    expect(viewport).toHaveStyle({ height: "492px" });
  });

  it("accepts a custom focus window through startHour/endHour", () => {
    render(<DayTimeline occurrences={[]} startHour={6} endHour={20} />);
    const viewport = screen.getByTestId("time-grid-viewport");
    expect(viewport.scrollTop).toBe(256);
    expect(viewport).toHaveStyle({ height: "624px" });
  });

  it("positions the 09:00 block 396px from the top of the day canvas", () => {
    render(<DayTimeline occurrences={OCCURRENCES} />);
    // The canvas starts at 00:00, so 09:00 sits 9 × 44px down.
    expect(blockFor(MORNING)).toHaveStyle({ top: "396px" });
  });

  it("[UI-01][AC-02] sizes each block's height in proportion to its duration", () => {
    render(<DayTimeline occurrences={OCCURRENCES} />);
    // rowPx=44 → 60 min = 44px. 30 min (morning) = 22px, 45 min (afternoon) = 33px.
    expect(blockFor(MORNING)).toHaveStyle({ height: "22px" });
    expect(blockFor(AFTERNOON)).toHaveStyle({ height: "33px" });
  });

  it("gives a compact block one line: title and start time only", () => {
    render(<DayTimeline occurrences={OCCURRENCES} />);
    const morning = within(blockFor(MORNING));

    expect(morning.getByText("Morning medication")).toBeInTheDocument();
    expect(morning.getByText("09:00")).toBeInTheDocument();
    expect(morning.queryByText("09:00–09:30")).not.toBeInTheDocument();
    expect(morning.queryByText("Done · Aisha Rahman")).not.toBeInTheDocument();
  });

  it("gives a regular block two lines: title and time range", () => {
    render(<DayTimeline occurrences={[PHYSIO]} />);
    const physio = within(blockFor(PHYSIO));

    expect(physio.getByText("Physiotherapy")).toBeInTheDocument();
    expect(physio.getByText("11:00–12:30")).toBeInTheDocument();
    expect(physio.queryByText("Planned")).not.toBeInTheDocument();
    expect(physio.queryByText("Sarah Nguyen")).not.toBeInTheDocument();
  });

  it("gives a full block the assignee and status pill as well", () => {
    render(<DayTimeline occurrences={[OUTING]} />);
    const outing = within(blockFor(OUTING));

    expect(outing.getByText("Community access")).toBeInTheDocument();
    expect(outing.getByText("15:00–17:00")).toBeInTheDocument();
    expect(outing.getByText("Jordan Lee")).toBeInTheDocument();
    expect(outing.getByText("Planned")).toBeInTheDocument();
  });

  it("sizes a lone block to the full column width in percentages", () => {
    render(<DayTimeline occurrences={[PHYSIO]} />);
    const block = blockFor(PHYSIO);
    expect(block.style.width).toContain("100%");
    expect(block.style.left).toContain("0%");
  });

  it("lays overlapping events out side by side", () => {
    const first: Occurrence = { ...PHYSIO, key: "a", start: "2026-11-30T10:00:00+11:00" };
    const second: Occurrence = { ...PHYSIO, key: "b", start: "2026-11-30T10:30:00+11:00" };
    render(<DayTimeline occurrences={[first, second]} />);

    const left = blockFor(first);
    const right = blockFor(second);
    expect(left.style.width).toContain("50%");
    expect(right.style.width).toContain("50%");
    expect(left.style.left).toContain("0%");
    expect(right.style.left).toContain("50%");
  });

  it("keeps a late block inside the day canvas", () => {
    render(<DayTimeline occurrences={[LATE]} />);
    const block = blockFor(LATE);
    // 24 × 44px = 1056px canvas; a 23:30 hour-long block is pulled up to fit.
    expect(block).toHaveStyle({ top: "1012px", height: "44px" });
  });

  it("opens the detail popover on click and reports the selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DayTimeline occurrences={OCCURRENCES} onSelect={onSelect} />);

    await user.click(blockFor(MORNING));

    expect(onSelect).toHaveBeenCalledWith(MORNING);
    const popover = screen.getByTestId(`event-popover-${MORNING.key}`);
    // Everything the compact block had no room for.
    expect(popover).toHaveTextContent("09:00–09:30");
    expect(popover).toHaveTextContent("Two tablets with breakfast");
    expect(popover).toHaveTextContent("Done · Aisha Rahman");
  });

  it("closes the popover on a second click of the same block", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.click(blockFor(MORNING));
    expect(screen.getByTestId(`event-popover-${MORNING.key}`)).toBeInTheDocument();

    await user.click(blockFor(MORNING));
    expect(screen.queryByTestId(`event-popover-${MORNING.key}`)).not.toBeInTheDocument();
  });

  it("closes the popover on Escape", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.click(blockFor(MORNING));
    await user.keyboard("{Escape}");

    expect(screen.queryByTestId(`event-popover-${MORNING.key}`)).not.toBeInTheDocument();
  });

  it("moves the popover to the block clicked next", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.click(blockFor(MORNING));
    await user.click(blockFor(AFTERNOON));

    expect(screen.queryByTestId(`event-popover-${MORNING.key}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`event-popover-${AFTERNOON.key}`)).toBeInTheDocument();
  });
});
