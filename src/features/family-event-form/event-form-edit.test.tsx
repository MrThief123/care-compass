import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { editEventDetailsValues } from "@/features/family-event-form/event-details";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { editEventValues, isTaskEvent } from "@/features/family-event-form/event-form-values";
import { getBudgetSummary } from "@/server/budget/queries";
import { getEvent } from "@/server/events/queries";
import type { BudgetBucketSummary, CareEvent } from "@/types/domain";

/*
 * FAM-07: Save event on Edit event persists through `updateEvent`. Mocks the action directly
 * so the exact payload (including the scope choice, PD-045) can be asserted without depending
 * on the mock data source's own state — that round trip is covered separately, against the
 * real mock contract, by `events/[eventId]/edit/page.test.tsx`.
 */
const mocks = vi.hoisted(() => ({ push: vi.fn(), updateEvent: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));

vi.mock("@/server/events/actions", () => ({ updateEvent: mocks.updateEvent }));

const CLIENT_ID = "client-margaret";
const PHYSIO_ID = "event-margaret-physio"; // weekly
const RETURN_HREF = "/family/client-margaret/home";

let buckets: BudgetBucketSummary[];
let physio: CareEvent;
let walk: CareEvent;

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  buckets = await getBudgetSummary(CLIENT_ID);
  physio = (await getEvent(CLIENT_ID, PHYSIO_ID))!;
  walk = (await getEvent(CLIENT_ID, "event-margaret-walk"))!; // daily plain event, still recurring
  mocks.updateEvent.mockResolvedValue({ ok: true, data: { eventId: physio.id } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderEdit(event: CareEvent) {
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
      returnHref={RETURN_HREF}
    />,
  );
}

describe("[FAM-07][AC-03] Save event validates Date on Edit event too", () => {
  it("[FAM-07][AC-03] a cleared Date shows a Date error, stays on the form and never calls updateEvent", async () => {
    const user = userEvent.setup();
    // Edit event's own Date field has no interactive way to clear an already-set date (it is a
    // read-only display driven by the Pick-a-date panel) — this proves the shared kit's Date
    // validation still gates Edit event's Save, the same guard Add event's own AC-02 test proves
    // through an initially-blank Date. See DECISIONS.md FD-02.
    render(
      <EventFormScreen
        mode="edit"
        clientId={CLIENT_ID}
        eventId={physio.id}
        occurrenceOriginalStart={physio.start}
        initialValues={{ ...editEventValues(physio), date: "" }}
        initialIsTask={isTaskEvent(physio)}
        initialDetails={editEventDetailsValues(physio)}
        buckets={buckets}
        month="2026-11-30"
        documents={[]}
        returnHref={RETURN_HREF}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save event" }));

    const date = screen.getByLabelText("Date");
    expect(date).toHaveAttribute("aria-invalid", "true");
    expect(date).toHaveAccessibleDescription("Date is required.");
    expect(mocks.updateEvent).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("[FAM-07][Scope] the scope selector (PD-045)", () => {
  it("[FAM-07][Scope] is shown for a recurring event, defaulting to 'This occurrence'", () => {
    renderEdit(physio);

    const group = screen.getByRole("radiogroup", { name: "Scope" });
    expect(screen.getByRole("radio", { name: "This occurrence" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(within(group).getByRole("radio", { name: "This and future" })).toBeDisabled();
  });

  it("[FAM-07][Scope] is absent for a one-off event", async () => {
    const oneOff = { ...physio, recurrenceFrequency: "none" as const };
    renderEdit(oneOff);

    expect(screen.queryByRole("radiogroup", { name: "Scope" })).not.toBeInTheDocument();
  });

  it("[FAM-07][Scope] Save event sends the chosen scope to updateEvent", async () => {
    const user = userEvent.setup();
    renderEdit(physio);

    await user.click(screen.getByRole("radio", { name: "Entire series" }));
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(mocks.updateEvent).toHaveBeenCalledWith(expect.objectContaining({ scope: "series" }));
  });

  it("[FAM-07][Scope] recurring event, not just tasks: Afternoon walk (a plain event) also gets the selector", () => {
    renderEdit(walk);

    expect(screen.getByRole("radiogroup", { name: "Scope" })).toBeInTheDocument();
  });
});

describe("[FAM-16][AC-10] Edit event shows Start time and End time", () => {
  it("[FAM-16][AC-10] End time is the start plus the duration, and Save sends the same duration", async () => {
    const user = userEvent.setup();
    renderEdit(physio);

    expect(screen.queryByLabelText("Duration")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Start time")).toHaveValue("11:30");
    expect(screen.getByLabelText("End time")).toHaveValue("13:00");

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(mocks.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ durationMinutes: physio.durationMinutes }),
    );
  });
});
