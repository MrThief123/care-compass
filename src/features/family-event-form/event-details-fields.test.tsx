import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_EVENT_DETAILS } from "./event-details";
import { EventDetailsFields } from "./event-details-fields";

describe("[FAM-06][AC-02] EventDetailsFields", () => {
  it("[FAM-16][AC-08] renders Title, Start time and End time, and no Duration", () => {
    render(
      <EventDetailsFields
        values={{ title: "Physiotherapy", startTime: "09:30", endTime: "10:15" }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Physiotherapy");
    expect(screen.getByLabelText("Start time")).toHaveValue("09:30");
    expect(screen.getByLabelText("End time")).toHaveValue("10:15");
    expect(screen.queryByLabelText("Duration")).not.toBeInTheDocument();
  });

  it("[FAM-06][AC-02] shows the Title, Start time and End time errors it is given", () => {
    render(
      <EventDetailsFields
        values={EMPTY_EVENT_DETAILS}
        onChange={vi.fn()}
        errors={{
          title: "Enter a title.",
          startTime: "Enter a start time (HH:mm).",
          endTime: "End time must be after the start time.",
        }}
      />,
    );

    expect(screen.getByLabelText("Title")).toBeInvalid();
    expect(screen.getByLabelText("Title")).toHaveAccessibleDescription("Enter a title.");
    expect(screen.getByLabelText("Start time")).toBeInvalid();
    expect(screen.getByLabelText("End time")).toBeInvalid();
  });

  it("[FAM-06] typing calls onChange with the field updated", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EventDetailsFields values={EMPTY_EVENT_DETAILS} onChange={onChange} />);

    await user.type(screen.getByLabelText("Title"), "W");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_EVENT_DETAILS, title: "W" });
  });
});
