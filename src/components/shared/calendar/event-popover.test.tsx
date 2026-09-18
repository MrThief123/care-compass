import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Occurrence } from "@/types/domain";

import { EventPopover } from "./event-popover";

const OCCURRENCE: Occurrence = {
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

function renderPopover(onClose = vi.fn()) {
  const anchor = document.createElement("button");
  document.body.append(anchor);
  render(<EventPopover occurrence={OCCURRENCE} anchor={anchor} onClose={onClose} />);
  return { anchor, onClose };
}

describe("[UI-01] EventPopover", () => {
  it("shows the detail a short block cannot fit", () => {
    renderPopover();
    const card = screen.getByRole("dialog", { name: "Morning medication" });
    expect(card).toHaveTextContent("09:00–09:30");
    expect(card).toHaveTextContent("30 min");
    expect(card).toHaveTextContent("Aisha Rahman");
    expect(card).toHaveTextContent("Two tablets with breakfast");
    expect(card).toHaveTextContent("Done · Aisha Rahman");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPopover();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on a click outside but not inside", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPopover();

    await user.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});
