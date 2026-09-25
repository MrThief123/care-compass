import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_EVENT_COST, type EventCostValues } from "@/features/family-event-form/event-cost";
import { EventCostFields } from "@/features/family-event-form/event-cost-fields";
import { getBudgetSummary } from "@/server/budget/queries";
import type { BudgetBucketSummary, RecurrenceFrequency } from "@/types/domain";

/*
 * The Cost field and the Paid from picker (T-01, T-03, T-04, T-05). The buckets
 * are what the budget contract returns for Margaret: NDIS $14,880 and Fixed
 * $2,750 are open; Government has a pending cost, so it is struck through. A
 * $0 bucket is hand-built (no fixture has one).
 */
const CLIENT_ID = "client-margaret";
const NDIS = "bucket-margaret-ndis";
const FIXED = "bucket-margaret-fixed";
const GOVERNMENT = "bucket-margaret-government";

let buckets: BudgetBucketSummary[];
let latest: EventCostValues = EMPTY_EVENT_COST;

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  latest = EMPTY_EVENT_COST;
  buckets = await getBudgetSummary(CLIENT_ID);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function Harness({
  initial = EMPTY_EVENT_COST,
  recurrence = "none",
  buckets: shown = buckets,
  errors,
  savedCost = false,
}: {
  initial?: EventCostValues;
  recurrence?: RecurrenceFrequency;
  buckets?: BudgetBucketSummary[];
  errors?: { cost?: string; bucketId?: string };
  savedCost?: boolean;
}) {
  const [values, setValues] = useState(initial);
  return (
    <EventCostFields
      values={values}
      onChange={(next) => {
        latest = next;
        setValues(next);
      }}
      buckets={shown}
      recurrence={recurrence}
      errors={errors}
      hasSavedCost={savedCost}
    />
  );
}

function picker() {
  return screen.getByRole("radiogroup", { name: "Paid from" });
}

describe("[FAM-UI-08][AC-01] Cost and Paid from", () => {
  it("[FAM-UI-08][AC-01] entering 90 and picking NDIS holds $90.00 from NDIS", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Cost"), "90");
    await user.click(within(picker()).getByRole("radio", { name: /NDIS/ }));

    expect(latest).toEqual({ cost: "90", bucketId: NDIS });
    expect(within(picker()).getByRole("radio", { name: /NDIS/ })).toBeChecked();
  });

  it("[FAM-UI-08][AC-01] each bucket option shows its remaining balance", () => {
    render(<Harness />);

    expect(within(picker()).getByRole("radio", { name: /NDIS/ })).toHaveAccessibleName(
      /\$14,880\.00/,
    );
    expect(within(picker()).getByRole("radio", { name: /Fixed/ })).toHaveAccessibleName(
      /\$2,750\.00/,
    );
  });

  it("[FAM-UI-08][AC-01] the fields have no requirement until a cost is entered", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Cost")).not.toBeRequired();
    expect(screen.queryByText(/charged each time/i)).not.toBeInTheDocument();
  });

  it("[FAM-UI-08][AC-02] shows the messages it is given on the Cost field and the picker", () => {
    render(<Harness errors={{ cost: "Enter a cost above $0.", bucketId: "Choose a bucket." }} />);

    expect(screen.getByLabelText("Cost")).toBeInvalid();
    expect(screen.getByLabelText("Cost")).toHaveAccessibleDescription(/Enter a cost above \$0\./);
    expect(picker()).toHaveAccessibleDescription(/Choose a bucket\./);
  });
});

describe("[FAM-UI-08][AC-03] buckets that cannot take new costs", () => {
  it("[FAM-UI-08][AC-03] a bucket with a pending cost is struck through, reads 'No funds left' and cannot be chosen", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const government = within(picker()).getByRole("radio", { name: /Government/ });
    expect(government).toBeDisabled();
    expect(government).toHaveAccessibleName(/No funds left/);
    expect(screen.getByText("Government")).toHaveClass("line-through");

    await user.click(government);
    expect(government).not.toBeChecked();
    expect(latest.bucketId).toBe("");
  });

  it("[FAM-UI-08][AC-03] a $0 bucket is struck through too, and the keyboard cannot reach or choose it", async () => {
    const user = userEvent.setup();
    const empty: BudgetBucketSummary = {
      id: "bucket-empty",
      kind: "fixed",
      label: "Fixed",
      total: 500,
      used: 500,
      remaining: 0,
      percentUsed: 100,
      state: "exhausted",
    };
    const ndis = buckets.find((bucket) => bucket.id === NDIS)!;
    render(<Harness buckets={[ndis, empty]} />);

    const radio = within(picker()).getByRole("radio", { name: /Fixed/ });
    expect(radio).toBeDisabled();
    expect(radio).toHaveAccessibleName(/No funds left/);

    await user.tab(); // Cost
    await user.tab(); // the first choosable bucket
    expect(within(picker()).getByRole("radio", { name: /NDIS/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(radio).not.toBeChecked();
    expect(radio).not.toHaveFocus();
  });

  it("[FAM-UI-08][AC-03] a saved bucket that is now struck through stays selected, with its note", () => {
    render(<Harness initial={{ cost: "$90.00", bucketId: GOVERNMENT }} savedCost />);

    const government = within(picker()).getByRole("radio", { name: /Government/ });
    expect(government).toBeChecked();
    expect(government).toHaveAccessibleName(/No funds left/);
  });

  it("[FAM-UI-08][AC-03] when no bucket has funds the picker says so", () => {
    const government = buckets.find((bucket) => bucket.id === GOVERNMENT)!;
    render(<Harness buckets={[government]} />);

    expect(screen.getByText(/no bucket has funds left/i)).toBeInTheDocument();
  });

  it("[FAM-UI-08][AC-03] has no accessibility violations", async () => {
    const { container } = render(
      <Harness
        initial={{ cost: "$90.00", bucketId: NDIS }}
        recurrence="weekly"
        savedCost
        errors={{ cost: "Enter a cost above $0." }}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[FAM-UI-08][AC-04] a cost above the balance", () => {
  it("[FAM-UI-08][AC-04] warns that it will be held as pending, and keeps the bucket selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Cost"), "3000");
    await user.click(within(picker()).getByRole("radio", { name: /Fixed/ }));

    expect(screen.getByText(/held as pending until funds are added/i)).toBeInTheDocument();
    expect(within(picker()).getByRole("radio", { name: /Fixed/ })).toBeChecked();
    expect(latest.bucketId).toBe(FIXED);
  });

  it("[FAM-UI-08][AC-04] gives no warning when the balance covers the cost", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Cost"), "90");
    await user.click(within(picker()).getByRole("radio", { name: /NDIS/ }));

    expect(screen.queryByText(/held as pending/i)).not.toBeInTheDocument();
  });

  it("[FAM-UI-08][AC-04] compares to the chosen bucket, and the warning goes when the cost is cleared", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ cost: "3000", bucketId: FIXED }} />);
    expect(screen.getByText(/held as pending/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Cost"));
    expect(screen.queryByText(/held as pending/i)).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-08][AC-05] recurring events", () => {
  it("[FAM-UI-08][AC-05] a recurring event with a cost reads 'Charged each time it's completed'", () => {
    render(<Harness initial={{ cost: "90", bucketId: NDIS }} recurrence="weekly" />);
    expect(screen.getByText("Charged each time it's completed")).toBeInTheDocument();
  });

  it("[FAM-UI-08][AC-05] a one-off event, or a recurring one with no cost, does not say it", () => {
    const { rerender } = render(
      <Harness key="one-off" initial={{ cost: "90", bucketId: NDIS }} recurrence="none" />,
    );
    expect(screen.queryByText(/charged each time/i)).not.toBeInTheDocument();

    rerender(<Harness key="no-cost" initial={EMPTY_EVENT_COST} recurrence="weekly" />);
    expect(screen.queryByText(/charged each time/i)).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-08][AC-06] the future-only note", () => {
  it("[FAM-UI-08][AC-06] says a change applies to future completions only when a cost is already saved", () => {
    render(<Harness initial={{ cost: "$90.00", bucketId: NDIS }} savedCost />);
    expect(screen.getByText(/applies to future completions only/i)).toBeInTheDocument();
  });

  it("[FAM-UI-08][AC-06] does not say it when there is no saved cost", () => {
    render(<Harness />);
    expect(screen.queryByText(/future completions/i)).not.toBeInTheDocument();
  });
});
