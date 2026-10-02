import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { EventForm, type EventFormValues } from "./event-form";

const BASE: EventFormValues = {
  date: "2026-12-15",
  recurrence: "none",
  status: "planned",
  description: "",
};

function Harness({ initial, month }: { initial: EventFormValues; month: string }) {
  const [values, setValues] = useState(initial);
  return (
    <>
      <button type="button" onClick={() => setValues({ ...values, date: "2027-02-03" })}>
        jump
      </button>
      <EventForm
        values={values}
        onChange={setValues}
        onSubmit={() => {}}
        onCancel={() => {}}
        month={month}
      />
    </>
  );
}

describe("[FAM-16][AC-06] EventForm's calendar follows the active date", () => {
  it("[FAM-16][AC-06] opens on the month of the date, not the month it was handed", () => {
    render(<Harness initial={BASE} month="2026-11-01" />);
    expect(screen.getByText("December 2026")).toBeInTheDocument();
  });

  it("[FAM-16][AC-06] with no date it opens on the month it was handed", () => {
    render(<Harness initial={{ ...BASE, date: "" }} month="2026-11-01" />);
    expect(screen.getByText("November 2026")).toBeInTheDocument();
  });

  it("[FAM-16][AC-06] moves to the new month when the date changes, and paging still works", async () => {
    const user = userEvent.setup();
    render(<Harness initial={BASE} month="2026-12-01" />);

    await user.click(screen.getByRole("button", { name: "jump" }));
    expect(screen.getByText("February 2027")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("March 2027")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByText("January 2027")).toBeInTheDocument();
  });

  it("[FAM-16][AC-06] picking a spill-over day from the next month shows that month", async () => {
    const user = userEvent.setup();
    render(<Harness initial={BASE} month="2026-12-01" />);

    await user.click(screen.getByTestId("date-picker-day-2027-01-02"));

    expect(screen.getByText("January 2027")).toBeInTheDocument();
  });
});
