import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { costValuesFromEvent } from "@/features/family-event-form/event-cost";
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
 * The cost fields inside the Add / Edit event screen (T-02, T-06): Save event
 * refuses a bad cost and stays on the form; Edit event opens with the fixture
 * Physiotherapy event's $90 from NDIS.
 */
const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));

const CLIENT_ID = "client-margaret";
const PHYSIO_ID = "event-margaret-physio";
const RETURN_HREF = "/family/client-margaret/home";

let buckets: BudgetBucketSummary[];
let physio: CareEvent;

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  buckets = await getBudgetSummary(CLIENT_ID);
  physio = (await getEvent(CLIENT_ID, PHYSIO_ID))!;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderEdit() {
  return render(
    <EventFormScreen
      mode="edit"
      initialValues={editEventValues(physio)}
      initialIsTask={isTaskEvent(physio)}
      initialCost={costValuesFromEvent(physio)}
      buckets={buckets}
      month="2026-11-30"
      documents={[]}
      returnHref={RETURN_HREF}
    />,
  );
}

function renderAdd() {
  return render(
    <EventFormScreen
      mode="add"
      initialValues={{ ...EMPTY_EVENT_VALUES, date: "2026-11-30" }}
      initialIsTask
      buckets={buckets}
      month="2026-11-30"
      documents={[]}
      returnHref={RETURN_HREF}
    />,
  );
}

describe("[FAM-UI-08][AC-06] Edit event opens with the saved cost", () => {
  it("[FAM-UI-08][AC-06] the fixture Physiotherapy event carries a $90 cost paid from NDIS", () => {
    expect(physio.cost).toBe(90);
    expect(physio.bucketId).toBe("bucket-margaret-ndis");
  });

  it("[FAM-UI-08][AC-06] Cost shows $90.00, NDIS is selected, and the form says a change applies to future completions only", () => {
    renderEdit();

    expect(screen.getByLabelText("Cost")).toHaveValue("$90.00");
    const group = screen.getByRole("radiogroup", { name: "Paid from" });
    expect(within(group).getByRole("radio", { name: /NDIS/ })).toBeChecked();
    expect(screen.getByText(/applies to future completions only/i)).toBeInTheDocument();
    // Physiotherapy is weekly, so the recurring line shows too (AC-05).
    expect(screen.getByText("Charged each time it's completed")).toBeInTheDocument();
  });

  it("[FAM-UI-08][AC-06] Save event with the saved cost goes back without saving", async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(mocks.push).toHaveBeenCalledWith(RETURN_HREF);
  });
});

describe("[FAM-UI-08][AC-02] Save event checks the cost", () => {
  it("[FAM-UI-08][AC-02] a cost of 0 is refused on the Cost field and the form stays", async () => {
    const user = userEvent.setup();
    renderAdd();

    await user.type(screen.getByLabelText("Cost"), "0");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(screen.getByLabelText("Cost")).toBeInvalid();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-08][AC-02] a cost with no bucket is refused on the picker and the form stays", async () => {
    const user = userEvent.setup();
    renderAdd();

    await user.type(screen.getByLabelText("Cost"), "90");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(screen.getByRole("radiogroup", { name: "Paid from" })).toBeInvalid();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-08][AC-02] a cost with a bucket saves; no cost and no bucket saves", async () => {
    const user = userEvent.setup();
    renderAdd();

    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.push).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText("Cost"), "90");
    await user.click(screen.getByRole("radio", { name: /NDIS/ }));
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.push).toHaveBeenCalledTimes(2);
  });

  it("[FAM-UI-08][AC-02] clearing the cost clears its error", async () => {
    const user = userEvent.setup();
    renderAdd();

    await user.type(screen.getByLabelText("Cost"), "0");
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(screen.getByLabelText("Cost")).toBeInvalid();

    await user.clear(screen.getByLabelText("Cost"));
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.push).toHaveBeenCalledWith(RETURN_HREF);
  });
});
