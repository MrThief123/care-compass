import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Occurrence } from "@/types/domain";

import { MonthGrid } from "./month-grid";

const OCCURRENCES: Occurrence[] = [
  {
    key: "event-meds:2026-11-24T09:00:00+11:00",
    eventId: "event-meds",
    clientId: "client-margaret",
    title: "Morning medication",
    description: "",
    start: "2026-11-24T09:00:00+11:00",
    durationMinutes: 30,
    status: "done",
    actor: "Aisha Rahman",
    assignee: "Aisha Rahman",
  },
];

/** Five occurrences on 2026-11-24, 09:00–13:00, for the overflow cases. */
const BUSY_DAY: Occurrence[] = ["09:00", "10:00", "11:00", "12:00", "13:00"].map((time, index) => ({
  key: `event-${index}:2026-11-24T${time}:00+11:00`,
  eventId: `event-${index}`,
  clientId: "client-margaret",
  title: `Care visit ${index + 1}`,
  description: "",
  start: `2026-11-24T${time}:00+11:00`,
  durationMinutes: 30,
  status: "planned",
  assignee: "Aisha Rahman",
}));

describe("[UI-01] MonthGrid", () => {
  it("marks today, selected and out-of-month cell states and shows an event chip", () => {
    render(
      <MonthGrid
        month="2026-11-15"
        today="2026-11-30"
        selected="2026-11-24"
        occurrences={OCCURRENCES}
      />,
    );

    expect(screen.getByTestId("month-grid-day-2026-11-30")).toHaveAttribute("aria-current", "date");
    expect(screen.getByTestId("month-grid-day-2026-11-24")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("month-grid-day-2026-11-24")).toHaveAttribute(
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

    const day24 = screen.getByTestId("month-grid-day-2026-11-24");
    // Time and title are separate elements so the title can truncate on its
    // own while the time stays fully visible (Notion-style chip).
    expect(within(day24).getByText("09:00")).toBeInTheDocument();
    expect(within(day24).getByText("Morning medication")).toBeInTheDocument();
  });

  it("renders a weekday header row aligned to the seven columns", () => {
    render(<MonthGrid month="2026-11-15" />);

    for (const label of ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("formats chip labels with the labelFormat prop when given", () => {
    render(
      <MonthGrid
        month="2026-11-15"
        occurrences={OCCURRENCES}
        labelFormat={(o) => `Margaret — ${o.title.slice(0, 7)}…`}
      />,
    );

    expect(screen.getByText("Margaret — Morning…")).toBeInTheDocument();
    // labelFormat replaces the whole label, so the default time part is gone.
    expect(screen.queryByText("09:00")).not.toBeInTheDocument();
  });

  it("caps chips at maxChipsPerDay and shows an 'N more' row for the rest", () => {
    render(<MonthGrid month="2026-11-15" occurrences={BUSY_DAY} maxChipsPerDay={3} />);

    const day24 = screen.getByTestId("month-grid-day-2026-11-24");
    // The overflow row takes one of the three slots, so two chips are shown
    // and the other three are summarised.
    expect(within(day24).getByText("Care visit 1")).toBeInTheDocument();
    expect(within(day24).getByText("Care visit 2")).toBeInTheDocument();
    expect(within(day24).queryByText("Care visit 3")).not.toBeInTheDocument();
    expect(within(day24).getByText("3 more")).toBeInTheDocument();
  });

  it("defaults to four rows per day", () => {
    render(<MonthGrid month="2026-11-15" occurrences={BUSY_DAY} />);

    const day24 = screen.getByTestId("month-grid-day-2026-11-24");
    expect(within(day24).getByText("Care visit 3")).toBeInTheDocument();
    expect(within(day24).queryByText("Care visit 4")).not.toBeInTheDocument();
    expect(within(day24).getByText("2 more")).toBeInTheDocument();
  });

  it("always keeps one chip visible, however low maxChipsPerDay is", () => {
    render(<MonthGrid month="2026-11-15" occurrences={BUSY_DAY} maxChipsPerDay={1} />);

    const day24 = screen.getByTestId("month-grid-day-2026-11-24");
    // A cell reading only "5 more" would tell the reader nothing.
    expect(within(day24).getByText("Care visit 1")).toBeInTheDocument();
    expect(within(day24).getByText("4 more")).toBeInTheDocument();
  });

  it("shows every chip when maxChipsPerDay is large enough", () => {
    render(<MonthGrid month="2026-11-15" occurrences={BUSY_DAY} maxChipsPerDay={5} />);

    const day24 = screen.getByTestId("month-grid-day-2026-11-24");
    for (let index = 1; index <= 5; index++) {
      expect(within(day24).getByText(`Care visit ${index}`)).toBeInTheDocument();
    }
    expect(within(day24).queryByText(/more$/)).not.toBeInTheDocument();
  });

  it("keeps the 'N more' row inside the day cell's own click target", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <MonthGrid
        month="2026-11-15"
        occurrences={BUSY_DAY}
        maxChipsPerDay={3}
        onSelectDate={onSelectDate}
      />,
    );

    const day24 = screen.getByTestId("month-grid-day-2026-11-24");
    // No nested interactive element inside the day button (axe: nested controls).
    expect(within(day24).queryByRole("button")).not.toBeInTheDocument();
    expect(within(day24).queryByRole("link")).not.toBeInTheDocument();

    await user.click(within(day24).getByText("3 more"));
    expect(onSelectDate).toHaveBeenCalledWith("2026-11-24");
  });

  it("calls onSelectDate with the clicked date", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<MonthGrid month="2026-11-15" onSelectDate={onSelectDate} />);

    await user.click(screen.getByTestId("month-grid-day-2026-11-24"));
    expect(onSelectDate).toHaveBeenCalledWith("2026-11-24");
  });
});
