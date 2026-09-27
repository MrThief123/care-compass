import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { EMPTY_EVENT_VALUES } from "@/features/family-event-form/event-form-values";
import { getBudgetSummary } from "@/server/budget/queries";
import type { BudgetBucketSummary } from "@/types/domain";

/*
 * FAM-06: Save event on Add event persists through `createEvent`. These mock the action
 * directly so the exact payload and the failure path can be asserted without depending on
 * the mock data source's own state (that round trip is covered separately, against the real
 * mock contract, by `event-form-cost.test.tsx` and `events/new/page.test.tsx`).
 */
const mocks = vi.hoisted(() => ({ push: vi.fn(), createEvent: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));

vi.mock("@/server/events/actions", () => ({ createEvent: mocks.createEvent }));

const CLIENT_ID = "client-margaret";
const RETURN_HREF = "/family/client-margaret/home";

let buckets: BudgetBucketSummary[];

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  buckets = await getBudgetSummary(CLIENT_ID);
  mocks.createEvent.mockResolvedValue({ ok: true, data: { eventId: "event-new" } });
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

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Title"), "Physiotherapy");
  await user.clear(screen.getByLabelText("Start time"));
  await user.type(screen.getByLabelText("Start time"), "09:30");
}

describe("[FAM-06][AC-01] Save event creates the event", () => {
  it("[FAM-06][AC-01] calls createEvent with the form's fields, including a chosen Recurring option", async () => {
    const user = userEvent.setup();
    renderAdd();
    await fillRequiredFields(user);
    await user.selectOptions(screen.getByLabelText("Recurring"), "weekly");
    await user.type(screen.getByLabelText("Description"), "Weekly session with Priya.");

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(mocks.createEvent).toHaveBeenCalledExactlyOnceWith({
      clientId: CLIENT_ID,
      title: "Physiotherapy",
      description: "Weekly session with Priya.",
      date: "2026-11-30",
      startTime: "09:30",
      durationMinutes: 0,
      recurrence: "weekly",
      isTask: true,
    });
  });

  it("[FAM-06][AC-01] on success, goes to returnHref", async () => {
    const user = userEvent.setup();
    renderAdd();
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(RETURN_HREF));
  });
});

describe("[FAM-06][AC-02] Save event checks Title and Start time before creating anything", () => {
  it("[FAM-06][AC-02] a blank Title is refused and createEvent is never called", async () => {
    const user = userEvent.setup();
    renderAdd();

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(screen.getByLabelText("Title")).toBeInvalid();
    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("[FAM-06] a failed save shows an error and stays on the form", () => {
  it("[FAM-06] createEvent's error message is shown; nothing navigates", async () => {
    mocks.createEvent.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save. Please try again." },
    });
    const user = userEvent.setup();
    renderAdd();
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(await screen.findByText("Couldn't save. Please try again.")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("[FAM-06][AC-05] Cancel discards unsaved input", () => {
  it("[FAM-06][AC-05] typed fields are not saved; createEvent is never called", async () => {
    const user = userEvent.setup();
    renderAdd();
    await user.type(screen.getByLabelText("Title"), "Should not save");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith(RETURN_HREF);
  });
});
