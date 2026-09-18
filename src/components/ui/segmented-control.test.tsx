import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./segmented-control";

describe("SegmentedControl", () => {
  it("[F0-14][AC-06] selects 'W' by default when no value prop is given", () => {
    render(<SegmentedControl />);

    expect(screen.getByRole("radio", { name: "W" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "D" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "M" })).toHaveAttribute("aria-checked", "false");
  });

  it("reflects a controlled value", () => {
    render(<SegmentedControl value="M" onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: "M" })).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the clicked option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SegmentedControl value="W" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "D" }));
    expect(onChange).toHaveBeenCalledWith("D");
  });
});
