// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  EMPTY_EVENT_COST,
  costValuesFromEvent,
  formatDollars,
  isBucketOpen,
  parseEventCost,
  validateEventCost,
} from "@/features/family-event-form/event-cost";
import type { BudgetBucketSummary } from "@/types/domain";

/*
 * T-02 (AC-02) plus the parsing and bucket rules the fields build on (AC-01,
 * AC-03). Buckets are hand-built so each edge case is exact.
 */

function bucket(overrides: Partial<BudgetBucketSummary> = {}): BudgetBucketSummary {
  return {
    id: "bucket-a",
    kind: "ndis",
    label: "NDIS",
    total: 1000,
    used: 400,
    remaining: 600,
    percentUsed: 40,
    state: "ok",
    ...overrides,
  };
}

const OPEN = bucket();
const EMPTY = bucket({ id: "bucket-b", label: "Fixed", used: 1000, remaining: 0 });
const PENDING = bucket({ id: "bucket-c", label: "Government", pendingCount: 1, pendingTotal: 310 });
const BUCKETS = [OPEN, EMPTY, PENDING];

describe("[FAM-UI-08][AC-02] validateEventCost", () => {
  it.each(["0", "0.00", "-5", "12.345", "abc", "1.2.3"])(
    "[FAM-UI-08][AC-02] refuses a cost of %s with a message on the Cost field",
    (cost) => {
      const errors = validateEventCost({ cost, bucketId: OPEN.id }, BUCKETS);
      expect(errors.cost).toBeTruthy();
    },
  );

  it("[FAM-UI-08][AC-02] refuses a cost with no bucket, with a message on the bucket picker", () => {
    const errors = validateEventCost({ cost: "90", bucketId: "" }, BUCKETS);
    expect(errors.bucketId).toMatch(/bucket/i);
    expect(errors.cost).toBeUndefined();
  });

  it("[FAM-UI-08][AC-02] accepts no cost and no bucket, and a cost with a bucket", () => {
    expect(validateEventCost(EMPTY_EVENT_COST, BUCKETS)).toEqual({});
    expect(validateEventCost({ cost: "   ", bucketId: "" }, BUCKETS)).toEqual({});
    expect(validateEventCost({ cost: "90", bucketId: OPEN.id }, BUCKETS)).toEqual({});
    expect(validateEventCost({ cost: "$1,250.5", bucketId: OPEN.id }, BUCKETS)).toEqual({});
    expect(validateEventCost({ cost: "0.01", bucketId: OPEN.id }, BUCKETS)).toEqual({});
  });

  it("[FAM-UI-08][AC-02] a bucket with no cost is not an error (clearing the cost clears the requirement)", () => {
    expect(validateEventCost({ cost: "", bucketId: OPEN.id }, BUCKETS)).toEqual({});
  });

  it("[FAM-UI-08][AC-03] with every bucket struck through, a cost cannot be saved and the message says why", () => {
    const errors = validateEventCost({ cost: "90", bucketId: "" }, [EMPTY, PENDING]);
    expect(errors.bucketId).toMatch(/no bucket has funds/i);
    // Without a cost the form still saves.
    expect(validateEventCost(EMPTY_EVENT_COST, [EMPTY, PENDING])).toEqual({});
  });
});

describe("[FAM-UI-08][AC-01] parseEventCost and formatDollars", () => {
  it("[FAM-UI-08][AC-01] holds '90' as $90.00 from the chosen bucket", () => {
    expect(parseEventCost({ cost: "90", bucketId: OPEN.id })).toEqual({
      amount: 90,
      bucketId: OPEN.id,
    });
    expect(parseEventCost({ cost: "$1,250.5", bucketId: OPEN.id })?.amount).toBe(1250.5);
  });

  it("[FAM-UI-08][AC-01] holds no cost for an empty field", () => {
    expect(parseEventCost(EMPTY_EVENT_COST)).toBeUndefined();
  });

  it("[FAM-UI-08][AC-01] shows dollars with cents", () => {
    expect(formatDollars(90)).toBe("$90.00");
    expect(formatDollars(14880)).toBe("$14,880.00");
    expect(formatDollars(0)).toBe("$0.00");
  });
});

describe("[FAM-UI-08][AC-03] isBucketOpen", () => {
  it("[FAM-UI-08][AC-03] is closed for a $0 balance or any pending cost, open otherwise", () => {
    expect(isBucketOpen(OPEN)).toBe(true);
    expect(isBucketOpen(EMPTY)).toBe(false);
    expect(isBucketOpen(PENDING)).toBe(false);
    expect(isBucketOpen(bucket({ remaining: -20 }))).toBe(false);
  });
});

describe("[FAM-UI-08][AC-06] costValuesFromEvent", () => {
  it("[FAM-UI-08][AC-06] opens with the saved cost and bucket, or empty for an event with none", () => {
    expect(costValuesFromEvent({ cost: 90, bucketId: OPEN.id })).toEqual({
      cost: "$90.00",
      bucketId: OPEN.id,
    });
    expect(costValuesFromEvent({})).toEqual(EMPTY_EVENT_COST);
    expect(costValuesFromEvent(undefined)).toEqual(EMPTY_EVENT_COST);
  });
});
