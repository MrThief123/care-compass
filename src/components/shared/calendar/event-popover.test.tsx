import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Occurrence } from "@/types/domain";

import { EventPopover } from "./event-popover";

import type { ComponentProps } from "react";

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

type PopoverProps = Omit<ComponentProps<typeof EventPopover>, "occurrence" | "anchor" | "onClose">;

function renderPopover(props: Partial<PopoverProps> = {}) {
  const onClose = vi.fn();
  const anchor = document.createElement("button");
  document.body.append(anchor);
  render(<EventPopover occurrence={OCCURRENCE} anchor={anchor} {...props} onClose={onClose} />);
  return { anchor, onClose };
}

describe("[UI-01] EventPopover", () => {
  it("shows the detail a short block cannot fit", () => {
    renderPopover();
    const card = screen.getByRole("tooltip");
    expect(card).toHaveTextContent("Morning medication");
    expect(card).toHaveTextContent("09:00–09:30");
    expect(card).toHaveTextContent("30 min");
    expect(card).toHaveTextContent("Aisha Rahman");
    expect(card).toHaveTextContent("Two tablets with breakfast");
    expect(card).toHaveTextContent("Done · Aisha Rahman");
  });

  it("carries the id its block points at with aria-describedby", () => {
    renderPopover({ id: "event-detail-meds" });
    expect(screen.getByRole("tooltip")).toHaveAttribute("id", "event-detail-meds");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPopover();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("stays open while the pointer is inside it, so its text can be read", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPopover();

    await user.click(screen.getByRole("tooltip"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on a press anywhere outside it, including on its own block", async () => {
    const user = userEvent.setup();
    const { anchor, onClose } = renderPopover();

    await user.click(document.body);
    expect(onClose).toHaveBeenCalled();

    onClose.mockClear();
    // Pressing the block itself opens the editor (UI-02), so the hover card
    // must get out of the way rather than sit over it.
    await user.click(anchor);
    expect(onClose).toHaveBeenCalled();
  });

  it("hands pointer enter and leave back to its owner so hover can hold it open", async () => {
    const user = userEvent.setup();
    const onPointerEnter = vi.fn();
    const onPointerLeave = vi.fn();
    renderPopover({ onPointerEnter, onPointerLeave });

    await user.hover(screen.getByRole("tooltip"));
    expect(onPointerEnter).toHaveBeenCalled();

    await user.unhover(screen.getByRole("tooltip"));
    expect(onPointerLeave).toHaveBeenCalled();
  });
});
