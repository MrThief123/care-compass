import { render, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
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

/** 4 hours → 176px: deep enough that its long title can wrap several times. */
const DAY_PROGRAM: Occurrence = {
  key: "event-program:2026-11-30T09:00:00+11:00",
  eventId: "event-program",
  clientId: "client-margaret",
  title: "Community participation day program with the Thursday group",
  description: "",
  start: "2026-11-30T09:00:00+11:00",
  durationMinutes: 240,
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

  it("shows the detail card on hover", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.hover(blockFor(MORNING));

    const popover = await screen.findByTestId(`event-popover-${MORNING.key}`);
    // Everything the compact block had no room for.
    expect(popover).toHaveTextContent("09:00–09:30");
    expect(popover).toHaveTextContent("Two tablets with breakfast");
    expect(popover).toHaveTextContent("Done · Aisha Rahman");
  });

  it("hides the detail card when the pointer leaves the block", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.hover(blockFor(MORNING));
    await screen.findByTestId(`event-popover-${MORNING.key}`);

    await user.unhover(blockFor(MORNING));
    await waitForElementToBeRemoved(() => screen.queryByTestId(`event-popover-${MORNING.key}`));
  });

  it("holds the card open while the pointer moves onto it (WCAG 1.4.13)", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.hover(blockFor(MORNING));
    const popover = await screen.findByTestId(`event-popover-${MORNING.key}`);

    await user.unhover(blockFor(MORNING));
    await user.hover(popover);
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(screen.getByTestId(`event-popover-${MORNING.key}`)).toBeInTheDocument();
  });

  it("moves the card to the block hovered next", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.hover(blockFor(MORNING));
    await screen.findByTestId(`event-popover-${MORNING.key}`);

    await user.hover(blockFor(AFTERNOON));

    expect(await screen.findByTestId(`event-popover-${AFTERNOON.key}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`event-popover-${MORNING.key}`)).not.toBeInTheDocument();
  });

  it("shows the detail card on keyboard focus and describes the block with it", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.tab();

    const block = blockFor(MORNING);
    expect(block).toHaveFocus();
    const popover = await screen.findByTestId(`event-popover-${MORNING.key}`);
    expect(block).toHaveAttribute("aria-describedby", popover.id);
  });

  it("closes the detail card on Escape", async () => {
    const user = userEvent.setup();
    render(<DayTimeline occurrences={OCCURRENCES} />);

    await user.hover(blockFor(MORNING));
    await screen.findByTestId(`event-popover-${MORNING.key}`);

    await user.keyboard("{Escape}");

    expect(screen.queryByTestId(`event-popover-${MORNING.key}`)).not.toBeInTheDocument();
  });

  it("reports the selection on click and gets the card out of the editor's way", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DayTimeline occurrences={OCCURRENCES} onSelect={onSelect} />);

    await user.click(blockFor(MORNING));

    // Clicking an event opens it for editing (UI-02); it is not what shows the
    // hover card, and the card must not be left sitting over the editor.
    expect(onSelect).toHaveBeenCalledWith(MORNING);
    expect(screen.queryByTestId(`event-popover-${MORNING.key}`)).not.toBeInTheDocument();
  });

  it("marks the current time with a line across the day and a gutter label", () => {
    render(<DayTimeline occurrences={[]} now={new Date("2026-11-30T12:30:00+11:00")} />);

    // 12:30 on a canvas of 44px hours starting at midnight.
    expect(screen.getByTestId("current-time-line")).toHaveStyle({ top: "550px" });
    expect(screen.getByTestId("time-grid-now-label")).toHaveTextContent("12:30");
  });

  it("keeps a compact block's title on its single line", () => {
    render(<DayTimeline occurrences={OCCURRENCES} />);
    expect(within(blockFor(MORNING)).getByText("Morning medication")).toHaveAttribute(
      "data-title-lines",
      "1",
    );
  });

  it("wraps a long title onto the lines the block's height affords", () => {
    render(<DayTimeline occurrences={[PHYSIO, DAY_PROGRAM]} />);

    // 66px regular block: 42px spare over its time range and padding.
    expect(within(blockFor(PHYSIO)).getByText("Physiotherapy")).toHaveAttribute(
      "data-title-lines",
      "2",
    );
    // 176px full block: room for every clamp the styles provide.
    expect(within(blockFor(DAY_PROGRAM)).getByText(DAY_PROGRAM.title)).toHaveAttribute(
      "data-title-lines",
      "6",
    );
  });

  it("never wraps a title into the room the time range needs", () => {
    render(<DayTimeline occurrences={[LATE]} />);
    // Clamped to 44px, so only the title's own line is left over.
    expect(within(blockFor(LATE)).getByText("Settling routine")).toHaveAttribute(
      "data-title-lines",
      "1",
    );
  });

  it("keeps a compact block's status icon out of its row height", () => {
    render(<DayTimeline occurrences={[MORNING]} />);
    // The row baseline-aligns the title with the time trailing it. A 14px icon
    // baselined alongside 13px text sits taller than the text's own line box
    // and pushes a 22px block's single row past the height it has, so the icon
    // is centred instead and the text alone decides the row.
    const icon = blockFor(MORNING).querySelector("svg");
    expect(icon).toHaveClass("self-center");
    expect(icon?.parentElement).toHaveClass("items-baseline");
  });

  it("gives up title height, not the time range, when the status pill grows", () => {
    render(<DayTimeline occurrences={[OUTING]} />);
    const block = blockFor(OUTING);

    // A status pill is free to render taller than its reserved height — a
    // longer label, a larger icon. The rows that carry the time and the status
    // hold their height; the title is the only row allowed to lose one, so a
    // pill can never squeeze the time range down to a clipped half-line.
    expect(within(block).getByText("15:00–17:00")).toHaveClass("shrink-0");
    expect(within(block).getByText(OUTING.title).parentElement).toHaveClass("min-h-0");
    expect(within(block).getByText("Jordan Lee").parentElement).toHaveClass("shrink-0");
  });
});
