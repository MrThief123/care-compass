import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { costValuesFromEvent } from "@/features/family-event-form/event-cost";
import { editEventDetailsValues } from "@/features/family-event-form/event-details";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import {
  EMPTY_EVENT_VALUES,
  editEventValues,
  isTaskEvent,
} from "@/features/family-event-form/event-form-values";
import { getBudgetSummary } from "@/server/budget/queries";
import { getEvent } from "@/server/events/queries";
import type { BudgetBucketSummary, CareEvent } from "@/types/domain";

/*
 * [FAM-11][AC-09] Save event hands the typed cost and bucket to createEvent / updateEvent. Add: only when a
 * cost is typed. Edit: the new cost, `null` when a saved cost was cleared, nothing when there never was one.
 */
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));
vi.mock("@/server/events/actions", () => ({
  createEvent: mocks.createEvent,
  updateEvent: mocks.updateEvent,
}));

const CLIENT_ID = "client-margaret";
const RETURN_HREF = "/family/client-margaret/home";

let buckets: BudgetBucketSummary[];
let physio: CareEvent;

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  mocks.createEvent.mockResolvedValue({ ok: true, data: { eventId: "new-event" } });
  mocks.updateEvent.mockResolvedValue({ ok: true, data: { eventId: "event-margaret-physio" } });
  buckets = await getBudgetSummary(CLIENT_ID);
  physio = (await getEvent(CLIENT_ID, "event-margaret-physio"))!;
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
      returnHref={RETURN_HREF}
    />,
  );
}

function renderEdit(event: CareEvent = physio) {
  return render(
    <EventFormScreen
      mode="edit"
      clientId={CLIENT_ID}
      eventId={event.id}
      occurrenceOriginalStart={event.start}
      initialValues={editEventValues(event)}
      initialIsTask={isTaskEvent(event)}
      initialCost={costValuesFromEvent(event)}
      initialDetails={editEventDetailsValues(event)}
      buckets={buckets}
      month="2026-11-30"
      documents={[]}
      returnHref={RETURN_HREF}
    />,
  );
}

describe("[FAM-11][AC-09] Add event", () => {
  it("[FAM-11][AC-09] passes the typed cost and the chosen bucket to createEvent", async () => {
    const user = userEvent.setup();
    renderAdd();
    await user.type(screen.getByLabelText("Title"), "Physiotherapy");
    await user.type(screen.getByLabelText("Cost"), "$90");
    await user.click(screen.getByRole("radio", { name: /NDIS/ }));
    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.createEvent).toHaveBeenCalledTimes(1));
    expect(mocks.createEvent.mock.calls[0]![0]).toMatchObject({
      cost: { amount: 90, bucketId: "bucket-margaret-ndis" },
    });
  });

  it("[FAM-11][AC-09] passes no cost when none is typed", async () => {
    const user = userEvent.setup();
    renderAdd();
    await user.type(screen.getByLabelText("Title"), "Physiotherapy");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.createEvent).toHaveBeenCalledTimes(1));
    expect(mocks.createEvent.mock.calls[0]![0]).not.toHaveProperty("cost");
  });
});

describe("[FAM-11][AC-09] Edit event", () => {
  it("[FAM-11][AC-09] passes the changed cost to updateEvent", async () => {
    const user = userEvent.setup();
    renderEdit();
    await user.clear(screen.getByLabelText("Cost"));
    await user.type(screen.getByLabelText("Cost"), "120");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.updateEvent).toHaveBeenCalledTimes(1));
    expect(mocks.updateEvent.mock.calls[0]![0]).toMatchObject({
      cost: { amount: 120, bucketId: "bucket-margaret-ndis" },
    });
  });

  it("[FAM-11][AC-09] passes null when a saved cost is cleared", async () => {
    const user = userEvent.setup();
    renderEdit();
    await user.clear(screen.getByLabelText("Cost"));
    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.updateEvent).toHaveBeenCalledTimes(1));
    expect(mocks.updateEvent.mock.calls[0]![0]).toMatchObject({ cost: null });
  });

  it("[FAM-11][AC-09] passes nothing when the event never had a cost", async () => {
    const user = userEvent.setup();
    const noCost = { ...physio, cost: undefined, bucketId: undefined } as CareEvent;
    renderEdit(noCost);
    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.updateEvent).toHaveBeenCalledTimes(1));
    expect(mocks.updateEvent.mock.calls[0]![0]).not.toHaveProperty("cost");
  });
});
