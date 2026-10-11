import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteEventButton } from "./delete-event-button";

/*
 * [FAM-18] The 'Delete event' control on Task detail: a one-off gets a confirmation, a recurring
 * event the choice between 'This occurrence' and 'This and all future occurrences'. The action is
 * mocked so the exact payload can be asserted; the data source itself is covered elsewhere.
 */
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  deleteEventOccurrence: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/server/events/actions", () => ({ deleteEventOccurrence: mocks.deleteEventOccurrence }));

const KEY = "event-margaret-physio:2026-11-30T11:30:00+11:00";
const BACK = "/family/client-margaret/calendar";

beforeEach(() => {
  mocks.deleteEventOccurrence.mockResolvedValue({ ok: true, data: undefined });
});
afterEach(() => vi.resetAllMocks());

function renderButton(recurring: boolean) {
  return render(
    <DeleteEventButton
      clientId="client-margaret"
      eventId="event-margaret-physio"
      occurrenceKey={KEY}
      recurring={recurring}
      returnHref={BACK}
    />,
  );
}

describe("[FAM-18] DeleteEventButton", () => {
  it("[FAM-18][AC-17] is a named button at least 44px tall and axe clean, open or closed", async () => {
    const user = userEvent.setup();
    const { container } = renderButton(true);
    const button = screen.getByRole("button", { name: "Delete event" });
    expect(button.className).toMatch(/h-11/);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(button);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-18][AC-02] a one-off asks to confirm, then deletes and returns to where the viewer came from", async () => {
    const user = userEvent.setup();
    renderButton(false);
    await user.click(screen.getByRole("button", { name: "Delete event" }));

    expect(screen.getByRole("dialog", { name: "Delete this event?" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(mocks.deleteEventOccurrence).toHaveBeenCalledWith({
      clientId: "client-margaret",
      eventId: "event-margaret-physio",
      occurrenceOriginalStart: "2026-11-30T11:30:00+11:00",
      scope: "occurrence",
    });
    expect(mocks.push).toHaveBeenCalledWith(BACK);
  });

  it("[FAM-18][AC-03] a recurring event offers both choices, 'This occurrence' selected", async () => {
    const user = userEvent.setup();
    renderButton(true);
    await user.click(screen.getByRole("button", { name: "Delete event" }));

    expect(screen.getByRole("radio", { name: "This occurrence" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "This and all future occurrences" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("[FAM-18][AC-05] choosing 'This and all future occurrences' sends scope future", async () => {
    const user = userEvent.setup();
    renderButton(true);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    await user.click(screen.getByRole("radio", { name: "This and all future occurrences" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(mocks.deleteEventOccurrence).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "future" }),
    );
    expect(mocks.push).toHaveBeenCalledWith(BACK);
  });

  it("[FAM-18][AC-07] Cancel and Esc close the dialog without deleting", async () => {
    const user = userEvent.setup();
    renderButton(true);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete event" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.deleteEventOccurrence).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-18][AC-11] a failed delete shows the message, keeps the dialog open and does not navigate", async () => {
    const user = userEvent.setup();
    mocks.deleteEventOccurrence.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't delete. Please try again." },
    });
    renderButton(false);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't delete. Please try again.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
