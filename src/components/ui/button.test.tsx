import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("[F0-05][AC-04] applies a visible focus ring when it receives keyboard focus", async () => {
    const user = userEvent.setup();
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toMatch(/focus-visible:ring-/);
    expect(button.className).toMatch(/focus-visible:outline-/);

    await user.tab();
    expect(button).toHaveFocus();
  });
});
