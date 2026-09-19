import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Field } from "./field";

describe("[UI-02][AC-01] Field", () => {
  it("associates the label, hint and error with the control", () => {
    render(
      <Field
        label="Email"
        type="email"
        value="not-an-email"
        onChange={() => {}}
        hint="We use this to send budget warnings."
        error="Enter a valid email address."
      />,
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    // The error replaces the hint in the description when both are present.
    expect(input).toHaveAccessibleDescription(
      "We use this to send budget warnings. Enter a valid email address.",
    );
  });

  it("is not marked invalid without an error", () => {
    render(<Field label="Name" value="Helen" onChange={() => {}} />);

    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("reports typed values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Field label="Name" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText("Name"), "H");

    expect(onChange).toHaveBeenCalledWith("H");
  });

  it("renders a textarea for type textarea", () => {
    render(<Field label="Description" type="textarea" value="Mobility." onChange={() => {}} />);

    expect(screen.getByLabelText("Description").tagName).toBe("TEXTAREA");
  });

  it("renders a select with its options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Field
        label="Recurring"
        type="select"
        value="weekly"
        onChange={onChange}
        options={[
          { value: "none", label: "Does not repeat" },
          { value: "weekly", label: "Weekly" },
        ]}
      />,
    );

    const select = screen.getByLabelText("Recurring");
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveValue("weekly");

    await user.selectOptions(select, "none");
    expect(onChange).toHaveBeenCalledWith("none");
  });

  it("marks required fields for assistive technology", () => {
    render(<Field label="Full name" value="" onChange={() => {}} required />);

    expect(screen.getByLabelText(/Full name/)).toBeRequired();
  });

  it("keeps a 44px minimum target height (REQ-N2)", () => {
    render(<Field label="Name" value="" onChange={() => {}} />);

    expect(screen.getByLabelText("Name")).toHaveClass("h-11");
  });
});
