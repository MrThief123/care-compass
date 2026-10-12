import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { editEventDetailsValues } from "@/features/family-event-form/event-details";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { editEventValues, isTaskEvent } from "@/features/family-event-form/event-form-values";
import { getBudgetSummary } from "@/server/budget/queries";
import { getEvent } from "@/server/events/queries";
import type { BudgetBucketSummary, CareEvent } from "@/types/domain";

/* [F0-27] The Delete event button, its confirmation, and the recurring choice, with `deleteEvent` mocked. */
const mocks = vi.hoisted(() => ({ push: vi.fn(), deleteEvent: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));
vi.mock("@/server/events/actions", () => ({ updateEvent: vi.fn(), createEvent: vi.fn() }));
vi.mock("@/server/events/delete-actions", () => ({ deleteEvent: mocks.deleteEvent }));

const CLIENT_ID = "client-margaret";
const DELETE_RETURN = "/family/client-margaret/calendar";

let buckets: BudgetBucketSummary[];
let weekly: CareEvent;
let oneOff: CareEvent;

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  buckets = await getBudgetSummary(CLIENT_ID);
  weekly = (await getEvent(CLIENT_ID, "event-margaret-physio"))!;
  oneOff = { ...weekly, id: "event-one-off", recurrenceFrequency: "none" };
  mocks.deleteEvent.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderEdit(event: CareEvent, withDelete = true) {
  return render(
    <EventFormScreen
      mode="edit"
      clientId={CLIENT_ID}
      eventId={event.id}
      occurrenceOriginalStart={event.start}
      initialValues={editEventValues(event)}
      initialIsTask={isTaskEvent(event)}
      initialDetails={editEventDetailsValues(event)}
      buckets={buckets}
      month="2026-11-30"
      documents={[]}
      returnHref="/family/client-margaret/home"
      deleteReturnHref={withDelete ? DELETE_RETURN : undefined}
    />,
  );
}

describe("Delete event", () => {
  it("[F0-27][AC-01] is absent when the screen is not given a place to return to after deleting", () => {
    renderEdit(weekly, false);
    expect(screen.queryByRole("button", { name: "Delete event" })).toBeNull();
  });

  it("[F0-27][AC-01] is absent on Add event", () => {
    render(
      <EventFormScreen
        mode="add"
        clientId={CLIENT_ID}
        initialValues={editEventValues(weekly)}
        initialIsTask
        buckets={buckets}
        month="2026-11-30"
        documents={[]}
        returnHref="/x"
        deleteReturnHref={DELETE_RETURN}
      />,
    );
    expect(screen.queryByRole("button", { name: "Delete event" })).toBeNull();
  });

  it("[F0-27][AC-02] Cancel in the confirmation deletes nothing", async () => {
    const user = userEvent.setup();
    renderEdit(oneOff);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.deleteEvent).not.toHaveBeenCalled();
  });

  it("[F0-27][AC-03] a one-off event is deleted with one confirm and the user goes back", async () => {
    const user = userEvent.setup();
    renderEdit(oneOff);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    expect(screen.queryByRole("button", { name: "Delete all future events" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(mocks.deleteEvent).toHaveBeenCalledWith({
      clientId: CLIENT_ID,
      eventId: oneOff.id,
      occurrenceOriginalStart: oneOff.start,
      scope: "occurrence",
    });
    expect(mocks.push).toHaveBeenCalledWith(DELETE_RETURN);
  });

  it("[F0-27][AC-04] a recurring event offers this event or all future events", async () => {
    const user = userEvent.setup();
    renderEdit(weekly);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    expect(screen.getByRole("button", { name: "Delete this event" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete all future events" })).toBeTruthy();
  });

  it("[F0-27][AC-05] 'Delete this event' sends the occurrence scope", async () => {
    const user = userEvent.setup();
    renderEdit(weekly);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    await user.click(screen.getByRole("button", { name: "Delete this event" }));
    expect(mocks.deleteEvent).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "occurrence" }),
    );
    expect(mocks.push).toHaveBeenCalledWith(DELETE_RETURN);
  });

  it("[F0-27][AC-06] 'Delete all future events' sends the future scope", async () => {
    const user = userEvent.setup();
    renderEdit(weekly);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    await user.click(screen.getByRole("button", { name: "Delete all future events" }));
    expect(mocks.deleteEvent).toHaveBeenCalledWith(expect.objectContaining({ scope: "future" }));
  });

  it("[F0-27][AC-08] a failure shows a message and stays on the form", async () => {
    const user = userEvent.setup();
    mocks.deleteEvent.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't delete. Please try again." },
    });
    renderEdit(oneOff);
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Couldn't delete. Please try again.")).toBeTruthy();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
