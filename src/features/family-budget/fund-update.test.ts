import { describe, expect, it } from "vitest";

import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

import {
  applyFundUpdate,
  validateFundUpdate,
  type FundUpdate,
  type FundUpdateValues,
} from "./fund-update";

/*
 * The simplified Update form (CHG-020, PD-058, DECISIONS.md FD-11): its
 * validation, and the local change a saved update makes to the bucket figures
 * and History. Phase 1: local state only, nothing is written anywhere.
 */

function bucket(
  kind: BudgetBucketSummary["kind"],
  label: string,
  total: number,
  used: number,
  extra: Partial<BudgetBucketSummary> = {},
): BudgetBucketSummary {
  const percentUsed = total === 0 ? 0 : Math.round((used / total) * 100);
  const state: BudgetBucketSummary["state"] =
    percentUsed >= 100
      ? "exhausted"
      : percentUsed >= 85
        ? "alert"
        : percentUsed >= 75
          ? "warning"
          : "ok";
  return { kind, label, total, used, remaining: total - used, percentUsed, state, ...extra };
}

const BUCKETS = [
  bucket("ndis", "NDIS", 24000, 9120),
  bucket("fixed", "Fixed", 5000, 2250),
  bucket("government", "Government", 3000, 2760),
];

const HISTORY: FundEntry[] = [
  {
    id: "fund-1",
    clientId: "client-margaret",
    bucketKind: "ndis",
    type: "topup",
    amount: 6000,
    date: "2026-11-03",
    description: "NDIS quarterly plan top-up",
    recordedBy: "Helen Doyle",
  },
];

const TODAY = "2026-11-30";

/** What the new History row is stamped with: the client, the reference day, a local id. */
const NEW_ROW = { clientId: "client-margaret", date: TODAY, id: "local-1" };

function values(overrides: Partial<FundUpdateValues> = {}): FundUpdateValues {
  return { bucket: "0", direction: "add", amount: "500", note: "", ...overrides };
}

function errorsOf(input: FundUpdateValues, buckets = BUCKETS) {
  const result = validateFundUpdate(input, buckets);
  return result.ok ? {} : result.errors;
}

describe("[FAM-UI-05][AC-06] validateFundUpdate (CHG-020)", () => {
  it("[FAM-UI-05][AC-06] accepts a bucket, Add, and a whole-dollar amount, with no note", () => {
    const result = validateFundUpdate(values(), BUCKETS);

    expect(result).toEqual({
      ok: true,
      data: { bucketIndex: 0, direction: "add", amount: 500, note: undefined },
    });
  });

  it.each([
    ["500.5", 500.5],
    ["500.50", 500.5],
    [" 75 ", 75],
    ["$1,250.75", 1250.75],
    ["0.01", 0.01],
  ])("[FAM-UI-05][AC-06] accepts the amount %j as %d", (amount, expected) => {
    const result = validateFundUpdate(values({ amount }), BUCKETS);

    expect(result.ok && result.data.amount).toBe(expected);
  });

  it.each([
    ["", "Enter an amount."],
    ["   ", "Enter an amount."],
    ["0", "Enter an amount more than $0."],
    ["0.00", "Enter an amount more than $0."],
    ["-5", "Enter an amount more than $0."],
    ["12.345", "Use no more than 2 decimal places."],
    ["abc", "Enter an amount in dollars, like 250 or 250.50."],
    ["1.2.3", "Enter an amount in dollars, like 250 or 250.50."],
    ["5e3", "Enter an amount in dollars, like 250 or 250.50."],
    ["10000000000", "Enter an amount under $10,000,000,000."],
  ])("[FAM-UI-05][AC-06] refuses the amount %j with %j on the amount field", (amount, message) => {
    expect(errorsOf(values({ amount }))).toEqual({ amount: message });
  });

  it("[FAM-UI-05][AC-06] refuses no bucket chosen, with a message on the bucket field", () => {
    expect(errorsOf(values({ bucket: "" }))).toEqual({ bucket: "Choose a bucket." });
  });

  it("[FAM-UI-05][AC-06] refuses a bucket that is not one of the client's", () => {
    expect(errorsOf(values({ bucket: "3" }))).toEqual({ bucket: "Choose a bucket." });
    expect(errorsOf(values({ bucket: "x" }))).toEqual({ bucket: "Choose a bucket." });
  });

  it("[FAM-UI-05][AC-06] reports every field that is wrong at once, one message each", () => {
    expect(errorsOf(values({ bucket: "", amount: "" }))).toEqual({
      bucket: "Choose a bucket.",
      amount: "Enter an amount.",
    });
  });

  it("[FAM-UI-05][AC-05] refuses a removal larger than the bucket's balance: 'Only $240 available'", () => {
    expect(errorsOf(values({ bucket: "2", direction: "remove", amount: "300" }))).toEqual({
      amount: "Only $240 available",
    });
  });

  it("[FAM-UI-05][AC-05] allows removing the whole balance, and refuses one cent more", () => {
    expect(
      validateFundUpdate(values({ bucket: "2", direction: "remove", amount: "240" }), BUCKETS).ok,
    ).toBe(true);
    expect(errorsOf(values({ bucket: "2", direction: "remove", amount: "240.01" }))).toEqual({
      amount: "Only $240 available",
    });
  });

  it("[FAM-UI-05][AC-05] keeps cents in the balance message", () => {
    const buckets = [bucket("fixed", "Fixed", 1000, 879.5)];

    expect(errorsOf(values({ direction: "remove", amount: "200" }), buckets)).toEqual({
      amount: "Only $120.50 available",
    });
  });

  it("[FAM-UI-05][AC-05] an empty or overspent bucket has $0 available to remove", () => {
    const buckets = [bucket("fixed", "Fixed", 1000, 1000), bucket("ndis", "NDIS", 1000, 1050)];

    expect(errorsOf(values({ bucket: "0", direction: "remove", amount: "1" }), buckets)).toEqual({
      amount: "Only $0 available",
    });
    expect(errorsOf(values({ bucket: "1", direction: "remove", amount: "1" }), buckets)).toEqual({
      amount: "Only $0 available",
    });
  });

  it("[FAM-UI-05][AC-05] an addition is never limited by the balance", () => {
    expect(validateFundUpdate(values({ bucket: "2", amount: "300" }), BUCKETS).ok).toBe(true);
  });

  it("[FAM-UI-05][PRD] trims the note, and a note of only spaces is no note", () => {
    const withNote = validateFundUpdate(values({ note: "  From savings  " }), BUCKETS);
    const blank = validateFundUpdate(values({ note: "   " }), BUCKETS);

    expect(withNote.ok && withNote.data.note).toBe("From savings");
    expect(blank.ok && blank.data.note).toBeUndefined();
  });
});

describe("[FAM-UI-05][AC-04] applyFundUpdate (local state only, CHG-020)", () => {
  const add500Ndis: FundUpdate = { bucketIndex: 0, direction: "add", amount: 500 };
  const remove40Government: FundUpdate = { bucketIndex: 2, direction: "remove", amount: 40 };

  it("[FAM-UI-05][AC-04] adding $500 to NDIS raises its total and remaining, and recomputes percent used", () => {
    const next = applyFundUpdate({ buckets: BUCKETS, history: HISTORY }, add500Ndis, NEW_ROW);

    expect(next.buckets[0]).toMatchObject({
      total: 24500,
      used: 9120,
      remaining: 15380,
      percentUsed: 37,
      state: "ok",
    });
    expect(next.buckets[1]).toEqual(BUCKETS[1]);
    expect(next.buckets[2]).toEqual(BUCKETS[2]);
  });

  it("[FAM-UI-05][AC-04] adds a first History row dated today, 'Funds added', +$500, against the bucket", () => {
    const next = applyFundUpdate({ buckets: BUCKETS, history: HISTORY }, add500Ndis, NEW_ROW);

    expect(next.history).toHaveLength(2);
    expect(next.history[0]).toEqual({
      id: "local-1",
      clientId: "client-margaret",
      bucketKind: "ndis",
      type: "topup",
      amount: 500,
      date: TODAY,
      description: "Funds added",
    });
    expect(next.history[1]).toEqual(HISTORY[0]);
  });

  it("[FAM-UI-05][AC-05] removing $40 from Government lowers its total and remaining; the row is 'Funds removed', -$40", () => {
    const next = applyFundUpdate(
      { buckets: BUCKETS, history: HISTORY },
      remove40Government,
      NEW_ROW,
    );

    expect(next.buckets[2]).toMatchObject({
      total: 2960,
      used: 2760,
      remaining: 200,
      percentUsed: 93,
      state: "alert",
    });
    expect(next.history[0]).toMatchObject({
      bucketKind: "government",
      type: "expense",
      amount: -40,
      date: TODAY,
      description: "Funds removed",
    });
  });

  it("[FAM-UI-05][PRD] the note, when there is one, is the row's description", () => {
    const next = applyFundUpdate(
      { buckets: BUCKETS, history: HISTORY },
      { ...add500Ndis, note: "From savings" },
      NEW_ROW,
    );

    expect(next.history[0]!.description).toBe("From savings");
  });

  it("[FAM-UI-05][PRD] removing the whole balance leaves $0 and an exhausted bucket (PD-032)", () => {
    const next = applyFundUpdate(
      { buckets: BUCKETS, history: HISTORY },
      { bucketIndex: 2, direction: "remove", amount: 240 },
      NEW_ROW,
    );

    expect(next.buckets[2]).toMatchObject({
      total: 2760,
      remaining: 0,
      percentUsed: 100,
      state: "exhausted",
    });
  });

  it("[FAM-UI-05][PRD] adding enough moves a bucket back under a threshold", () => {
    const next = applyFundUpdate(
      { buckets: BUCKETS, history: HISTORY },
      { bucketIndex: 2, direction: "add", amount: 1000 },
      NEW_ROW,
    );

    // 2760 of 4000 is 69% used.
    expect(next.buckets[2]).toMatchObject({ remaining: 1240, percentUsed: 69, state: "ok" });
  });

  it("[FAM-UI-05][PRD] sums in cents, so no floating-point residue reaches the card", () => {
    const buckets = [bucket("fixed", "Fixed", 100.1, 0)];
    const next = applyFundUpdate(
      { buckets, history: [] },
      { bucketIndex: 0, direction: "add", amount: 0.2 },
      NEW_ROW,
    );

    expect(next.buckets[0]!.total).toBe(100.3);
    expect(next.buckets[0]!.remaining).toBe(100.3);
  });

  it("[FAM-UI-05][PRD] does not pay pending costs: they are F0-12's, so the pending figures are kept as they are", () => {
    const buckets = [
      ...BUCKETS.slice(0, 2),
      { ...BUCKETS[2]!, pendingTotal: 310, pendingCount: 1 },
    ];
    const next = applyFundUpdate(
      { buckets, history: HISTORY },
      { bucketIndex: 2, direction: "add", amount: 500 },
      NEW_ROW,
    );

    expect(next.buckets[2]).toMatchObject({ remaining: 740, pendingTotal: 310, pendingCount: 1 });
  });

  it("[FAM-UI-05][PRD] only the chosen bucket changes, even when two buckets are of the same kind", () => {
    const buckets = [bucket("ndis", "NDIS core", 1000, 0), bucket("ndis", "NDIS capital", 1000, 0)];
    const next = applyFundUpdate(
      { buckets, history: [] },
      { bucketIndex: 1, direction: "add", amount: 50 },
      NEW_ROW,
    );

    expect(next.buckets[0]).toEqual(buckets[0]);
    expect(next.buckets[1]!.total).toBe(1050);
  });

  it("[FAM-UI-05][PRD] changes nothing it was given: it returns new state", () => {
    const buckets = structuredClone(BUCKETS);
    const history = structuredClone(HISTORY);

    applyFundUpdate({ buckets, history }, add500Ndis, NEW_ROW);

    expect(buckets).toEqual(BUCKETS);
    expect(history).toEqual(HISTORY);
  });
});
