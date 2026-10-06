import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { InfoTip } from "./info-tip";

const TEXT = "Add a care event for the person you care for.";

function setup() {
  return render(
    <div>
      <InfoTip label="Enter event" text={TEXT} />
      <button type="button">Elsewhere</button>
    </div>,
  );
}

describe("InfoTip", () => {
  it("[FAM-17][AC-01] renders a named button of at least 44px with the tip hidden", () => {
    setup();

    const button = screen.getByRole("button", { name: "About Enter event" });
    expect(button.className).toMatch(/\bh-11\b/);
    expect(button.className).toMatch(/\bw-11\b/);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("[FAM-17][AC-02] shows on hover and hides when the pointer leaves", async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole("button", { name: "About Enter event" });

    await user.hover(button);
    expect(screen.getByRole("tooltip")).toHaveTextContent(TEXT);

    await user.unhover(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("[FAM-17][AC-03] stays open when the pointer moves onto the tip", async () => {
    const user = userEvent.setup();
    setup();

    await user.hover(screen.getByRole("button", { name: "About Enter event" }));
    await user.hover(screen.getByRole("tooltip"));

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("[FAM-17][AC-04] shows on keyboard focus, described by the tip, and hides on blur", async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole("button", { name: "About Enter event" });

    await user.tab();
    expect(button).toHaveFocus();
    const tip = screen.getByRole("tooltip");
    expect(button).toHaveAttribute("aria-describedby", tip.id);

    await user.tab();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(button).not.toHaveAttribute("aria-describedby");
  });

  it("[FAM-17][AC-05] toggles on click and closes on a click elsewhere", async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole("button", { name: "About Enter event" });

    await user.click(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("[FAM-17][AC-05] a second click closes it even while the pointer is still over it", async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole("button", { name: "About Enter event" });

    await user.click(button);
    await user.click(button);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("[FAM-17][AC-06] Esc closes it and focus stays on the button", async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole("button", { name: "About Enter event" });

    await user.click(button);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
});
