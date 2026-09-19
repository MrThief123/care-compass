import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EventForm, type EventFormValues } from "./event-form";

/** The 'Physiotherapy' event from the design (family-03-edit-event). */
const PHYSIOTHERAPY: EventFormValues = {
  date: "2026-11-30",
  recurrence: "weekly",
  status: "planned",
  description:
    "30-minute mobility and strength session with the physiotherapist. Focus on balance exercises per the current care plan.",
};

describe("[UI-02][AC-01] EventForm required Date", () => {
  it("shows an inline error on Date and does not call onSubmit when Date is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <EventForm
        values={{ ...PHYSIOTHERAPY, date: "" }}
        onChange={() => {}}
        onSubmit={onSubmit}
        onCancel={() => {}}
        month="2026-11-15"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save event" }));

    const dateField = screen.getByLabelText("Date");
    expect(dateField).toHaveAccessibleDescription("Date is required.");
    expect(dateField).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit once Date is present", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <EventForm
        values={PHYSIOTHERAPY}
        onChange={() => {}}
        onSubmit={onSubmit}
        onCancel={() => {}}
        month="2026-11-15"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(onSubmit).toHaveBeenCalledWith(PHYSIOTHERAPY);
  });
});

describe("[UI-02][AC-05] EventForm renders the Physiotherapy fixture", () => {
  it("shows the long date, Weekly recurrence, the Planned chip and a 'Pick a date' calendar", () => {
    render(
      <EventForm
        values={PHYSIOTHERAPY}
        onChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        month="2026-11-15"
      />,
    );

    expect(screen.getByLabelText("Date")).toHaveValue("Monday 30 November 2026");
    expect(screen.getByLabelText("Recurring")).toHaveValue("weekly");
    expect(screen.getByRole("radio", { name: "Planned" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Pick a date")).toBeInTheDocument();
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("does not let the user select Overdue (PD-044: Overdue is derived)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <EventForm
        values={PHYSIOTHERAPY}
        onChange={onChange}
        onSubmit={() => {}}
        onCancel={() => {}}
        month="2026-11-15"
      />,
    );

    const overdue = screen.getByRole("radio", { name: "Overdue" });
    expect(overdue).toBeDisabled();

    await user.click(overdue);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the Documents slot", () => {
    render(
      <EventForm
        values={PHYSIOTHERAPY}
        onChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        month="2026-11-15"
        documents={<p>Physio referral.pdf</p>}
      />,
    );

    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Physio referral.pdf")).toBeInTheDocument();
  });

  it("selecting a day in the picker reports the new date", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <EventForm
        values={PHYSIOTHERAPY}
        onChange={onChange}
        onSubmit={() => {}}
        onCancel={() => {}}
        month="2026-11-15"
      />,
    );

    await user.click(screen.getByTestId("date-picker-day-2026-11-24"));

    expect(onChange).toHaveBeenCalledWith({ ...PHYSIOTHERAPY, date: "2026-11-24" });
  });
});
