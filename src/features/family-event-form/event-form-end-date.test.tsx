import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { editEventDetailsValues } from "@/features/family-event-form/event-details";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import {
  EMPTY_EVENT_VALUES,
  editEventValues,
  isTaskEvent,
} from "@/features/family-event-form/event-form-values";
import { getBudgetSummary } from "@/server/budget/queries";
import { getEvent } from "@/server/events/queries";
import type { BudgetBucketSummary } from "@/types/domain";

/*
 * [FAM-18] The 'Ends' field: optional, only for a repeating event, never before the Date, and
 * sent to createEvent / updateEvent as `endDate`. The actions are mocked to assert the payload.
 */
const mocks = vi.hoisted(() => ({ push: vi.fn(), createEvent: vi.fn(), updateEvent: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));
vi.mock("@/server/events/actions", () => ({
  createEvent: mocks.createEvent,
  updateEvent: mocks.updateEvent,
}));

const CLIENT_ID = "client-margaret";
let buckets: BudgetBucketSummary[];

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  buckets = await getBudgetSummary(CLIENT_ID);
  mocks.createEvent.mockResolvedValue({ ok: true, data: { eventId: "event-new" } });
  mocks.updateEvent.mockResolvedValue({ ok: true, data: { eventId: "event-x" } });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderAdd() {
  return render(
    <EventFormScreen
      mode="add"
      clientId={CLIENT_ID}
      initialValues={{ ...EMPTY_EVENT_VALUES, date: "2026-11-30" }}
      initialIsTask
      buckets={buckets}
      month="2026-11-30"
      documents={[]}
      returnHref="/family/client-margaret/home"
    />,
  );
}

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Title"), "Physiotherapy");
  await user.clear(screen.getByLabelText("Start time"));
  await user.type(screen.getByLabelText("Start time"), "09:30");
}

describe("[FAM-18] Ends on Add event", () => {
  it("[FAM-18][AC-12] is absent for 'Does not repeat' and shown, empty, for any repeat option", async () => {
    const user = userEvent.setup();
    renderAdd();
    expect(screen.queryByLabelText("Ends")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Recurring"), "weekly");
    expect(screen.getByLabelText("Ends")).toHaveValue("");
  });

  it("[FAM-18][AC-13] sends the chosen end date as endDate", async () => {
    const user = userEvent.setup();
    renderAdd();
    await fill(user);
    await user.selectOptions(screen.getByLabelText("Recurring"), "weekly");
    await user.type(screen.getByLabelText("Ends"), "2026-12-21");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(mocks.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ recurrence: "weekly", endDate: "2026-12-21" }),
    );
  });

  it("[FAM-18][AC-12] leaves endDate out when Ends is empty, or when the event stops repeating", async () => {
    const user = userEvent.setup();
    renderAdd();
    await fill(user);
    await user.selectOptions(screen.getByLabelText("Recurring"), "weekly");
    await user.type(screen.getByLabelText("Ends"), "2026-12-21");
    await user.selectOptions(screen.getByLabelText("Recurring"), "none");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(mocks.createEvent.mock.calls[0]![0]).not.toHaveProperty("endDate");
  });

  it("[FAM-18][AC-14] an end date before the Date is an Ends error and nothing is saved", async () => {
    const user = userEvent.setup();
    renderAdd();
    await fill(user);
    await user.selectOptions(screen.getByLabelText("Recurring"), "weekly");
    await user.type(screen.getByLabelText("Ends"), "2026-11-01");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(screen.getByLabelText("Ends")).toBeInvalid();
    expect(screen.getByLabelText("Ends")).toHaveAccessibleDescription(
      /Ends must be on or after the Date\./,
    );
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });
});

describe("[FAM-18] Ends on Edit event", () => {
  async function renderEdit(endDate?: string) {
    const event = {
      ...(await getEvent(CLIENT_ID, "event-margaret-physio"))!,
      recurrenceEndDate: endDate,
    };
    render(
      <EventFormScreen
        mode="edit"
        clientId={CLIENT_ID}
        eventId={event.id}
        occurrenceOriginalStart={event.start}
        initialValues={editEventValues(event)}
        initialIsTask={isTaskEvent(event)}
        initialDetails={editEventDetailsValues(event)}
        initialEndDate={endDate}
        buckets={buckets}
        month="2026-11-30"
        documents={[]}
        returnHref="/family/client-margaret/home"
      />,
    );
  }

  it("[FAM-18][AC-15] shows the saved end date, and a change is sent as endDate", async () => {
    const user = userEvent.setup();
    await renderEdit("2027-01-31");
    expect(screen.getByLabelText("Ends")).toHaveValue("2027-01-31");

    await user.clear(screen.getByLabelText("Ends"));
    await user.type(screen.getByLabelText("Ends"), "2027-03-31");
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ endDate: "2027-03-31" }),
    );
  });

  it("[FAM-18][AC-15] clearing a saved end date sends endDate null", async () => {
    const user = userEvent.setup();
    await renderEdit("2027-01-31");
    await user.clear(screen.getByLabelText("Ends"));
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.updateEvent).toHaveBeenCalledWith(expect.objectContaining({ endDate: null }));
  });

  it("[FAM-18][AC-15] with none saved and none typed, endDate is left out", async () => {
    const user = userEvent.setup();
    await renderEdit();
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.updateEvent.mock.calls[0]![0]).not.toHaveProperty("endDate");
  });
});
