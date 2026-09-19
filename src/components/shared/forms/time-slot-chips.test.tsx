import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { TimeSlotChips, type TimeSlotValue } from "./time-slot-chips";

function TimeSlotHarness({ initial }: { initial?: TimeSlotValue }) {
  const [value, setValue] = useState<TimeSlotValue>(initial ?? { slot: "07:00-11:00" });
  return <TimeSlotChips value={value} onChange={setValue} />;
}

describe("[UI-02][AC-03] TimeSlotChips custom slot", () => {
  it("reveals start and end time inputs when 'Custom' is selected", async () => {
    const user = userEvent.setup();
    render(<TimeSlotHarness />);

    expect(screen.queryByLabelText("Start time")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("End time")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Custom" }));

    expect(screen.getByLabelText("Start time")).toBeInTheDocument();
    expect(screen.getByLabelText("End time")).toBeInTheDocument();
  });

  it("offers the three preset slots and hides the custom inputs again when one is chosen", async () => {
    const user = userEvent.setup();
    render(<TimeSlotHarness />);

    expect(screen.getByRole("radio", { name: "07:00 – 11:00" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "11:00 – 15:00" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "15:00 – 19:00" })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Custom" }));
    expect(screen.getByLabelText("Start time")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "11:00 – 15:00" }));
    expect(screen.queryByLabelText("Start time")).not.toBeInTheDocument();
  });
});

describe("[UI-02][AC-04] TimeSlotChips custom range validation", () => {
  it("shows an end-time error when the end is before the start", async () => {
    const user = userEvent.setup();
    render(<TimeSlotHarness initial={{ slot: "custom", customStart: "12:00", customEnd: "" }} />);

    const endTime = screen.getByLabelText("End time");
    await user.type(endTime, "10:00");

    expect(endTime).toHaveAccessibleDescription("End time must be after the start time.");
    expect(endTime).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the same error when start and end are equal", () => {
    render(
      <TimeSlotHarness initial={{ slot: "custom", customStart: "12:00", customEnd: "12:00" }} />,
    );

    expect(screen.getByLabelText("End time")).toHaveAccessibleDescription(
      "End time must be after the start time.",
    );
  });

  it("clears the error once the range is valid", async () => {
    const user = userEvent.setup();
    render(
      <TimeSlotHarness initial={{ slot: "custom", customStart: "12:00", customEnd: "10:00" }} />,
    );

    const endTime = screen.getByLabelText("End time");
    expect(endTime).toHaveAttribute("aria-invalid", "true");

    await user.clear(endTime);
    await user.type(endTime, "14:00");

    expect(endTime).not.toHaveAttribute("aria-invalid", "true");
  });

  it("does not report an error while the range is incomplete", () => {
    render(<TimeSlotHarness initial={{ slot: "custom", customStart: "12:00", customEnd: "" }} />);

    expect(screen.getByLabelText("End time")).not.toHaveAttribute("aria-invalid", "true");
  });
});
