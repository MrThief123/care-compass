import { describe, expect, it } from "vitest";

import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

import {
  applyBudgetEdit,
  editValuesFor,
  nameSuggestions,
  validateBudgetEdit,
  type BudgetEdit,
  type BudgetEditValues,
} from "./budget-edit";

/*
 * The Edit budget page's rules (CHG-021, PD-059, DECISIONS.md FD-12): what it
 * starts from, what it refuses, and the local change a save makes to the
 * buckets and History. Phase 1: local state only, nothing is written anywhere.
 * These replace the CHG-020 form's `fund-update.test.ts`; the amount rules and
 * the balance limit are kept.
 */

function bucket(
  id: string,
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
  return { id, kind, label, total, used, remaining: total - used, percentUsed, state, ...extra };
}

const BUCKETS = [
  bucket("bucket-ndis", "ndis", "NDIS", 24000, 9120),
  bucket("bucket-fixed", "fixed", "Fixed", 5000, 2250),
  bucket("bucket-government", "government", "Government", 3000, 2760),
];

/** A bucket with nothing spent and nothing pending, so it can be removed. */
const COUNCIL = bucket("bucket-council", undefined, "Council grant", 1200, 0);

const HISTORY: FundEntry[] = [
  {
    id: "fund-1",
    clientId: "client-margaret",
    bucketId: "bucket-ndis",
    bucketKind: "ndis",
    type: "topup",
    amount: 6000,
    date: "2026-11-03",
    description: "NDIS quarterly plan top-up",
    recordedBy: "Helen Doyle",
  },
];

/** A cost a bucket could not cover when the care was completed (CHG-020, PD-058). */
function pendingCost(
  id: string,
  amount: number,
  date: string,
  description = "Physiotherapy",
  bucketId = "bucket-government",
): FundEntry {
  return {
    id,
    clientId: "client-margaret",
    bucketId,
    type: "expense",
    amount: -amount,
    date,
    description,
    recordedBy: "Aisha Rahman",
    pending: true,
  };
}

/** Margaret's fixture: Government at $240 holding a $310 cost from 27 Oct 2026. */
const PHYSIO = pendingCost("fund-pending-1", 310, "2026-10-27");

/** Government with pending costs of `total` over `count` costs. */
function governmentPending(total: number, count: number, extra: Partial<BudgetBucketSummary> = {}) {
  return [
    BUCKETS[0]!,
    BUCKETS[1]!,
    { ...BUCKETS[2]!, pendingTotal: total, pendingCount: count, ...extra },
  ];
}

const BUCKETS_PENDING = governmentPending(310, 1);

const HISTORY_PENDING: FundEntry[] = [HISTORY[0]!, PHYSIO];

/** `entry` as it reads once paid on `date` (CHG-022): the same row, no longer pending. */
function paid(entry: FundEntry, date: string): FundEntry {
  const next: FundEntry = { ...entry, paidOn: date };
  delete next.pending;
  return next;
}

const TODAY = "2026-11-30";

/** What a save's new rows are stamped with: the client, the reference day, and which save it is. */
const SAVE = { clientId: "client-margaret", date: TODAY, save: 1 };

/** The page's starting values for `buckets`, with the changes in `change` made to them. */
function values(
  change: {
    buckets?: Record<number, Partial<BudgetEditValues["buckets"][number]>>;
    added?: BudgetEditValues["added"];
    note?: string;
  } = {},
  buckets: BudgetBucketSummary[] = BUCKETS,
): BudgetEditValues {
  const start = editValuesFor(buckets);
  return {
    buckets: start.buckets.map((row, i) => ({ ...row, ...change.buckets?.[i] })),
    added: change.added ?? [],
    note: change.note ?? "",
  };
}

function errorsOf(input: BudgetEditValues, buckets = BUCKETS) {
  const result = validateBudgetEdit(input, buckets);
  return result.ok ? {} : result.errors;
}

function dataOf(input: BudgetEditValues, buckets = BUCKETS): BudgetEdit {
  const result = validateBudgetEdit(input, buckets);
  if (!result.ok) throw new Error(`refused: ${JSON.stringify(result.errors)}`);
  return result.data;
}

function apply(edit: BudgetEdit, buckets = BUCKETS, history = HISTORY, save = SAVE) {
  return applyBudgetEdit({ buckets, history }, edit, save);
}

describe("[FAM-UI-05][AC-04] editValuesFor (CHG-021)", () => {
  it("[FAM-UI-05][AC-04] starts each bucket at its saved name, Add, a blank amount and not removed; no new buckets and no note", () => {
    expect(editValuesFor(BUCKETS)).toEqual({
      buckets: [
        { id: "bucket-ndis", name: "NDIS", direction: "add", amount: "", remove: false },
        { id: "bucket-fixed", name: "Fixed", direction: "add", amount: "", remove: false },
        {
          id: "bucket-government",
          name: "Government",
          direction: "add",
          amount: "",
          remove: false,
        },
      ],
      added: [],
      note: "",
    });
  });

  it("[FAM-UI-05][AC-12] with no buckets, starts with nothing to edit", () => {
    expect(editValuesFor([])).toEqual({ buckets: [], added: [], note: "" });
  });
});

describe("[FAM-UI-05][AC-12] nameSuggestions (CHG-021)", () => {
  it("[FAM-UI-05][AC-12] offers 'NDIS', 'Fixed' and 'Government', in that order, when none is in use", () => {
    expect(nameSuggestions([])).toEqual(["NDIS", "Fixed", "Government"]);
  });

  it("[FAM-UI-05][AC-12] leaves out a name already in use, ignoring case and spaces around it", () => {
    expect(nameSuggestions(["  ndis "])).toEqual(["Fixed", "Government"]);
    expect(nameSuggestions(["Council grant", "GOVERNMENT"])).toEqual(["NDIS", "Fixed"]);
  });

  it("[FAM-UI-05][AC-09] offers nothing when all three are in use", () => {
    expect(nameSuggestions(["NDIS", "Fixed", "Government"])).toEqual([]);
  });
});

describe("[FAM-UI-05][AC-06] validateBudgetEdit: amounts (CHG-021, kept from CHG-020)", () => {
  it("[FAM-UI-05][AC-04] accepts the untouched page: every amount blank is no change", () => {
    expect(dataOf(values())).toEqual({
      buckets: [
        { id: "bucket-ndis", name: "NDIS", direction: "add", amount: 0, remove: false },
        { id: "bucket-fixed", name: "Fixed", direction: "add", amount: 0, remove: false },
        {
          id: "bucket-government",
          name: "Government",
          direction: "add",
          amount: 0,
          remove: false,
        },
      ],
      added: [],
      note: undefined,
    });
  });

  it.each([
    ["500", 500],
    ["500.5", 500.5],
    ["500.50", 500.5],
    [" 75 ", 75],
    ["$1,250.75", 1250.75],
    ["0.01", 0.01],
    ["   ", 0],
  ])("[FAM-UI-05][AC-06] accepts the amount %j as %d", (amount, expected) => {
    expect(dataOf(values({ buckets: { 0: { amount } } })).buckets[0]!.amount).toBe(expected);
  });

  it.each([
    ["0", "Enter an amount more than $0."],
    ["0.00", "Enter an amount more than $0."],
    ["-5", "Enter an amount more than $0."],
    ["12.345", "Use no more than 2 decimal places."],
    ["abc", "Enter an amount in dollars, like 250 or 250.50."],
    ["1.2.3", "Enter an amount in dollars, like 250 or 250.50."],
    ["5e3", "Enter an amount in dollars, like 250 or 250.50."],
    ["10000000000", "Enter an amount under $10,000,000,000."],
  ])(
    "[FAM-UI-05][AC-06] refuses the amount %j with %j on that bucket's amount",
    (amount, message) => {
      expect(errorsOf(values({ buckets: { 1: { amount } } }))).toEqual({
        "buckets.1.amount": message,
      });
    },
  );

  it("[FAM-UI-05][AC-05] refuses a removal larger than the bucket's balance: 'Only $240 available'", () => {
    expect(errorsOf(values({ buckets: { 2: { direction: "remove", amount: "300" } } }))).toEqual({
      "buckets.2.amount": "Only $240 available",
    });
  });

  it("[FAM-UI-05][AC-05] allows removing the whole balance, and refuses one cent more", () => {
    expect(
      validateBudgetEdit(
        values({ buckets: { 2: { direction: "remove", amount: "240" } } }),
        BUCKETS,
      ).ok,
    ).toBe(true);
    expect(errorsOf(values({ buckets: { 2: { direction: "remove", amount: "240.01" } } }))).toEqual(
      { "buckets.2.amount": "Only $240 available" },
    );
  });

  it("[FAM-UI-05][AC-05] keeps cents in the balance message", () => {
    const buckets = [bucket("b-1", "fixed", "Fixed", 1000, 879.5)];

    expect(
      errorsOf(
        values({ buckets: { 0: { direction: "remove", amount: "200" } } }, buckets),
        buckets,
      ),
    ).toEqual({ "buckets.0.amount": "Only $120.50 available" });
  });

  it("[FAM-UI-05][AC-05] an empty or overspent bucket has $0 available to remove", () => {
    const buckets = [
      bucket("b-1", "fixed", "Fixed", 1000, 1000),
      bucket("b-2", "ndis", "NDIS", 1000, 1050),
    ];
    const removeOne = { direction: "remove" as const, amount: "1" };

    expect(errorsOf(values({ buckets: { 0: removeOne, 1: removeOne } }, buckets), buckets)).toEqual(
      {
        "buckets.0.amount": "Only $0 available",
        "buckets.1.amount": "Only $0 available",
      },
    );
  });

  it("[FAM-UI-05][AC-05] an addition is never limited by the balance", () => {
    expect(validateBudgetEdit(values({ buckets: { 2: { amount: "300" } } }), BUCKETS).ok).toBe(
      true,
    );
  });

  it("[FAM-UI-05][AC-11] a bucket marked for removal has its amount ignored, even one that would be refused", () => {
    const buckets = [...BUCKETS, COUNCIL];
    const data = dataOf(
      values({ buckets: { 3: { remove: true, amount: "abc" } } }, buckets),
      buckets,
    );

    expect(data.buckets[3]).toMatchObject({ remove: true, amount: 0 });
  });
});

describe("[FAM-UI-05][AC-06] validateBudgetEdit: names (CHG-021)", () => {
  it.each([
    ["empty", "", "Enter a name."],
    ["only spaces", "   ", "Enter a name."],
    ["41 characters", "N".repeat(41), "Use 40 characters or fewer."],
    ["another bucket's, ignoring case", "ndis", "Another bucket already has this name."],
    ["another's with spaces around it", "  Government ", "Another bucket already has this name."],
  ])("[FAM-UI-05][AC-06] refuses a renamed bucket whose name is %s", (_case, name, message) => {
    expect(errorsOf(values({ buckets: { 1: { name } } }))).toEqual({ "buckets.1.name": message });
  });

  it("[FAM-UI-05][AC-06] accepts exactly 40 characters, and trims the name", () => {
    const forty = "F".repeat(40);

    expect(dataOf(values({ buckets: { 1: { name: `  ${forty}  ` } } })).buckets[1]!.name).toBe(
      forty,
    );
  });

  it("[FAM-UI-05][AC-10] a change of case alone is a rename, not a duplicate of itself", () => {
    expect(dataOf(values({ buckets: { 1: { name: "FIXED" } } })).buckets[1]!.name).toBe("FIXED");
  });

  it("[FAM-UI-05][AC-06] only the new or renamed name is marked, not the bucket that had the name first", () => {
    expect(errorsOf(values({ added: [{ name: "government", startingAmount: "100" }] }))).toEqual({
      "added.0.name": "Another bucket already has this name.",
    });
  });

  it("[FAM-UI-05][AC-06] two new buckets with the same name are both marked", () => {
    const added = [
      { name: "Council grant", startingAmount: "100" },
      { name: "council grant", startingAmount: "200" },
    ];

    expect(errorsOf(values({ added }))).toEqual({
      "added.0.name": "Another bucket already has this name.",
      "added.1.name": "Another bucket already has this name.",
    });
  });

  it("[FAM-UI-05][AC-06] saved buckets that already share a name, unchanged, do not stop a save", () => {
    const buckets = [bucket("b-1", "ndis", "NDIS", 1000, 0), bucket("b-2", "ndis", "NDIS", 500, 0)];

    expect(validateBudgetEdit(values({}, buckets), buckets).ok).toBe(true);
  });

  it("[FAM-UI-05][AC-06] a bucket being removed frees its name", () => {
    const buckets = [...BUCKETS, COUNCIL];
    const input = values(
      {
        buckets: { 3: { remove: true } },
        added: [{ name: "Council grant", startingAmount: "500" }],
      },
      buckets,
    );

    expect(validateBudgetEdit(input, buckets).ok).toBe(true);
  });
});

describe("[FAM-UI-05][AC-06] validateBudgetEdit: new buckets and removal (CHG-021)", () => {
  it("[FAM-UI-05][AC-09] accepts a new bucket's name and starting amount, trimmed and in dollars", () => {
    const data = dataOf(values({ added: [{ name: " Council grant ", startingAmount: "$1,200" }] }));

    expect(data.added).toEqual([{ name: "Council grant", startingAmount: 1200 }]);
  });

  it("[FAM-UI-05][AC-12] accepts a starting amount of 0", () => {
    const data = dataOf(values({ added: [{ name: "Government", startingAmount: "0" }] }, []), []);

    expect(data.added).toEqual([{ name: "Government", startingAmount: 0 }]);
  });

  it.each([
    ["", "Enter a starting amount, or 0."],
    ["   ", "Enter a starting amount, or 0."],
    ["-5", "Enter an amount of $0 or more."],
    ["12.345", "Use no more than 2 decimal places."],
    ["abc", "Enter an amount in dollars, like 250 or 250.50."],
    ["10000000000", "Enter an amount under $10,000,000,000."],
  ])("[FAM-UI-05][AC-06] refuses the starting amount %j with %j", (startingAmount, message) => {
    expect(errorsOf(values({ added: [{ name: "Council grant", startingAmount }] }))).toEqual({
      "added.0.startingAmount": message,
    });
  });

  it("[FAM-UI-05][AC-06] refuses a new bucket with no name", () => {
    expect(errorsOf(values({ added: [{ name: " ", startingAmount: "10" }] }))).toEqual({
      "added.0.name": "Enter a name.",
    });
  });

  it("[FAM-UI-05][AC-11] refuses to remove a bucket with money spent or pending, whatever the page sent", () => {
    const buckets = [
      BUCKETS[0]!,
      bucket("b-pending", undefined, "Grant", 100, 0, { pendingTotal: 20, pendingCount: 1 }),
    ];
    const errors = errorsOf(
      values({ buckets: { 0: { remove: true }, 1: { remove: true } } }, buckets),
      buckets,
    );

    expect(Object.keys(errors).sort()).toEqual(["buckets.0.remove", "buckets.1.remove"]);
  });

  it("[FAM-UI-05][AC-06] reports every field that is wrong at once, one message each", () => {
    const input = values({
      buckets: { 0: { amount: "0" }, 2: { name: "" } },
      added: [{ name: "", startingAmount: "" }],
    });

    expect(errorsOf(input)).toEqual({
      "buckets.0.amount": "Enter an amount more than $0.",
      "buckets.2.name": "Enter a name.",
      "added.0.name": "Enter a name.",
      "added.0.startingAmount": "Enter a starting amount, or 0.",
    });
  });

  it("[FAM-UI-05][PRD] trims the note, and a note of only spaces is no note", () => {
    expect(dataOf(values({ note: "  From savings  " })).note).toBe("From savings");
    expect(dataOf(values({ note: "   " })).note).toBeUndefined();
  });
});

/** An edit that changes nothing, for the tests below to change one part of. */
function noChange(buckets = BUCKETS): BudgetEdit {
  return dataOf(values({}, buckets), buckets);
}

function withBucket(
  edit: BudgetEdit,
  index: number,
  change: Partial<BudgetEdit["buckets"][number]>,
): BudgetEdit {
  return {
    ...edit,
    buckets: edit.buckets.map((row, i) => (i === index ? { ...row, ...change } : row)),
  };
}

describe("[FAM-UI-05] applyBudgetEdit: funds (local state only, CHG-021)", () => {
  it("[FAM-UI-05][AC-04] adding $500 to NDIS raises its total and remaining, and recomputes percent used", () => {
    const next = apply(withBucket(noChange(), 0, { amount: 500 }));

    expect(next.buckets[0]).toMatchObject({
      id: "bucket-ndis",
      total: 24500,
      used: 9120,
      remaining: 15380,
      percentUsed: 37,
      state: "ok",
    });
    expect(next.buckets[1]).toEqual(BUCKETS[1]);
    expect(next.buckets[2]).toEqual(BUCKETS[2]);
    expect(next.changed).toBe(true);
  });

  it("[FAM-UI-05][AC-04] adds a first History row dated today, 'Funds added', +$500, against the bucket's id", () => {
    const next = apply(withBucket(noChange(), 0, { amount: 500 }));

    expect(next.history).toHaveLength(2);
    expect(next.history[0]).toMatchObject({
      clientId: "client-margaret",
      bucketId: "bucket-ndis",
      type: "topup",
      amount: 500,
      date: TODAY,
      description: "Funds added",
    });
    // CHG-022 (PD-060): stated, not empty; Phase 1 has no signed-in user.
    expect(next.history[0]!.recordedBy).toBe("you");
    expect(next.history[0]!.pending).toBeUndefined();
    expect(next.history[1]).toEqual(HISTORY[0]);
  });

  it("[FAM-UI-05][AC-05] removing $40 from Government lowers its total and remaining; the row is 'Funds removed', -$40", () => {
    const next = apply(withBucket(noChange(), 2, { direction: "remove", amount: 40 }));

    expect(next.buckets[2]).toMatchObject({
      total: 2960,
      used: 2760,
      remaining: 200,
      percentUsed: 93,
      state: "alert",
    });
    expect(next.history[0]).toMatchObject({
      bucketId: "bucket-government",
      type: "expense",
      amount: -40,
      description: "Funds removed",
    });
  });

  it("[FAM-UI-05][AC-04] the note, when there is one, is every funds row's description", () => {
    const edit = withBucket(withBucket(noChange(), 0, { amount: 100 }), 1, { amount: 50 });
    const next = apply({ ...edit, note: "Plan review" });

    expect(next.history.slice(0, 2).map((row) => row.description)).toEqual([
      "Plan review",
      "Plan review",
    ]);
  });

  it("[FAM-UI-05][PRD] removing the whole balance leaves $0 and an exhausted bucket (PD-032)", () => {
    const next = apply(withBucket(noChange(), 2, { direction: "remove", amount: 240 }));

    expect(next.buckets[2]).toMatchObject({
      total: 2760,
      remaining: 0,
      percentUsed: 100,
      state: "exhausted",
    });
  });

  it("[FAM-UI-05][PRD] adding enough moves a bucket back under a threshold", () => {
    const next = apply(withBucket(noChange(), 2, { amount: 1000 }));

    // 2760 of 4000 is 69% used.
    expect(next.buckets[2]).toMatchObject({ remaining: 1240, percentUsed: 69, state: "ok" });
  });

  it("[FAM-UI-05][PRD] sums in cents, so no floating-point residue reaches the card", () => {
    const buckets = [bucket("b-1", "fixed", "Fixed", 100.1, 0)];
    const next = apply(withBucket(noChange(buckets), 0, { amount: 0.2 }), buckets, []);

    expect(next.buckets[0]!.total).toBe(100.3);
    expect(next.buckets[0]!.remaining).toBe(100.3);
  });

  it("[FAM-UI-05][AC-14] adding $500 to Government pays its $310 pending cost: $430 left and no pending figures (CHG-022)", () => {
    const next = apply(
      withBucket(noChange(BUCKETS_PENDING), 2, { amount: 500 }),
      BUCKETS_PENDING,
      HISTORY_PENDING,
    );

    expect(next.buckets[2]!.remaining).toBe(430);
    expect(next.buckets[2]!.pendingTotal ?? 0).toBe(0);
    expect(next.buckets[2]!.pendingCount ?? 0).toBe(0);
  });

  it("[FAM-UI-05][PRD] only the bucket with that id changes, even when two buckets share a kind and a name", () => {
    const buckets = [
      bucket("b-1", "ndis", "NDIS", 1000, 0),
      bucket("b-2", "ndis", "NDIS", 1000, 0),
    ];
    const next = apply(withBucket(noChange(buckets), 1, { amount: 50 }), buckets, []);

    expect(next.buckets[0]).toEqual(buckets[0]);
    expect(next.buckets[1]!.total).toBe(1050);
    expect(next.history[0]!.bucketId).toBe("b-2");
  });
});

describe("[FAM-UI-05] applyBudgetEdit: buckets (local state only, CHG-021)", () => {
  it("[FAM-UI-05][AC-09] a new bucket is added last with its starting amount, nothing used, and a 'Bucket added' row", () => {
    const next = apply({ ...noChange(), added: [{ name: "Council grant", startingAmount: 1200 }] });

    expect(next.buckets).toHaveLength(4);
    const added = next.buckets[3]!;
    expect(added).toMatchObject({
      label: "Council grant",
      total: 1200,
      used: 0,
      remaining: 1200,
      percentUsed: 0,
      state: "ok",
    });
    expect(added.kind).toBeUndefined();
    expect(next.history[0]).toMatchObject({
      bucketId: added.id,
      type: "topup",
      amount: 1200,
      date: TODAY,
      description: "Bucket added",
    });
  });

  it("[FAM-UI-05][AC-12] a new bucket named like a suggestion, ignoring case, gets that kind; at $0 it reads 0% used", () => {
    const next = apply(
      { ...noChange([]), added: [{ name: "government", startingAmount: 0 }] },
      [],
      [],
    );

    expect(next.buckets[0]).toMatchObject({
      kind: "government",
      label: "government",
      total: 0,
      remaining: 0,
      percentUsed: 0,
      state: "ok",
    });
    expect(next.history[0]).toMatchObject({ description: "Bucket added", amount: 0 });
  });

  it("[FAM-UI-05][AC-10] a rename changes the name only: same id, kind and figures, and no row", () => {
    const next = apply(withBucket(noChange(), 1, { name: "Fixed support" }));

    expect(next.buckets[1]).toEqual({ ...BUCKETS[1]!, label: "Fixed support" });
    expect(next.history).toEqual(HISTORY);
    expect(next.changed).toBe(true);
  });

  it("[FAM-UI-05][AC-11] a removed bucket goes, with a 'Bucket removed' row for minus what was left in it", () => {
    const buckets = [...BUCKETS, COUNCIL];
    const next = apply(withBucket(noChange(buckets), 3, { remove: true }), buckets);

    expect(next.buckets.map((b) => b.id)).toEqual([
      "bucket-ndis",
      "bucket-fixed",
      "bucket-government",
    ]);
    expect(next.history[0]).toMatchObject({
      bucketId: "bucket-council",
      type: "expense",
      amount: -1200,
      description: "Bucket removed",
    });
  });

  it("[FAM-UI-05][AC-11] removing a bucket with $0 in it makes a row of 0, never -0", () => {
    const buckets = [bucket("b-empty", undefined, "Empty grant", 0, 0)];
    const next = apply(withBucket(noChange(buckets), 0, { remove: true }), buckets, []);

    expect(next.buckets).toEqual([]);
    expect(Object.is(next.history[0]!.amount, -0)).toBe(false);
    expect(next.history[0]!.amount).toBe(0);
  });

  it("[FAM-UI-05][AC-11] the note does not replace 'Bucket added' or 'Bucket removed'", () => {
    const buckets = [...BUCKETS, COUNCIL];
    const edit = withBucket(noChange(buckets), 3, { remove: true });
    const next = apply(
      { ...edit, added: [{ name: "Family gift", startingAmount: 50 }], note: "Tidy up" },
      buckets,
    );

    expect(next.history.slice(0, 2).map((row) => row.description)).toEqual([
      "Bucket removed",
      "Bucket added",
    ]);
  });

  it("[FAM-UI-05][AC-04] rows follow the page's order: saved buckets first, then new ones; all above the old rows", () => {
    const buckets = [...BUCKETS, COUNCIL];
    let edit = withBucket(noChange(buckets), 2, { direction: "remove", amount: 40 });
    edit = withBucket(edit, 0, { amount: 100 });
    edit = withBucket(edit, 3, { remove: true });
    const next = apply(
      {
        ...edit,
        added: [
          { name: "Family gift", startingAmount: 50 },
          { name: "Council grant", startingAmount: 300 },
        ],
      },
      buckets,
    );

    expect(next.history.map((row) => [row.description, row.amount])).toEqual([
      ["Funds added", 100],
      ["Funds removed", -40],
      ["Bucket removed", -1200],
      ["Bucket added", 50],
      ["Bucket added", 300],
      ["NDIS quarterly plan top-up", 6000],
    ]);
    expect(next.buckets.map((b) => b.label)).toEqual([
      "NDIS",
      "Fixed",
      "Government",
      "Family gift",
      "Council grant",
    ]);
  });

  it("[FAM-UI-05][PRD] every new bucket and row has an id no other bucket or row has, across saves too", () => {
    const first = apply({
      ...withBucket(noChange(), 0, { amount: 100 }),
      added: [
        { name: "Family gift", startingAmount: 50 },
        { name: "Council grant", startingAmount: 300 },
      ],
    });
    const second = apply(
      {
        ...withBucket(noChange(first.buckets), 0, { amount: 100 }),
        added: [{ name: "Respite fund", startingAmount: 10 }],
      },
      first.buckets,
      first.history,
      { ...SAVE, save: 2 },
    );

    const bucketIds = second.buckets.map((b) => b.id);
    const rowIds = second.history.map((row) => row.id);
    expect(new Set(bucketIds).size).toBe(bucketIds.length);
    expect(new Set(rowIds).size).toBe(rowIds.length);
    expect(bucketIds.filter((id) => rowIds.includes(id))).toEqual([]);
  });

  it("[FAM-UI-05][AC-04] an edit that changes nothing says so, and leaves the figures and History as they were", () => {
    const next = apply(noChange());

    expect(next.changed).toBe(false);
    expect(next.buckets).toEqual(BUCKETS);
    expect(next.history).toEqual(HISTORY);
  });

  it("[FAM-UI-05][PRD] changes nothing it was given: it returns new state", () => {
    const buckets = structuredClone([...BUCKETS, COUNCIL]);
    const history = structuredClone(HISTORY);
    const edit = withBucket(withBucket(noChange(buckets), 0, { amount: 500 }), 3, { remove: true });

    applyBudgetEdit(
      { buckets, history },
      { ...edit, added: [{ name: "Family gift", startingAmount: 50 }] },
      SAVE,
    );

    expect(buckets).toEqual([...BUCKETS, COUNCIL]);
    expect(history).toEqual(HISTORY);
  });
});

/*
 * CHG-022 (PD-060): after a bucket gains funds, its pending costs are paid
 * whole, strictly oldest first, stopping at the first one the balance cannot
 * cover. A paid cost keeps its History row, loses `pending` and gains
 * `paidOn`; no new row is added. Local state only, as the rest of a save.
 */
describe("[FAM-UI-05][AC-14] applyBudgetEdit pays pending costs when funds are added (CHG-022)", () => {
  function addToGovernment(amount: number, buckets: BudgetBucketSummary[], history: FundEntry[]) {
    return apply(withBucket(noChange(buckets), 2, { amount }), buckets, history);
  }

  it("[FAM-UI-05][AC-14] adding $100 to Government ($240) pays the $310 cost whole: $30 left, taken off as used, no pending figures", () => {
    const next = addToGovernment(100, BUCKETS_PENDING, HISTORY_PENDING);

    // 3000 + 100 = 3100 total; 2760 + 310 = 3070 used, 99% (PD-032 alert).
    expect(next.buckets[2]).toMatchObject({
      id: "bucket-government",
      total: 3100,
      used: 3070,
      remaining: 30,
      percentUsed: 99,
      state: "alert",
    });
    expect(next.buckets[2]!.pendingTotal ?? 0).toBe(0);
    expect(next.buckets[2]!.pendingCount ?? 0).toBe(0);
  });

  it("[FAM-UI-05][AC-14] the paid cost keeps its History row, in place, no longer pending and paid today; no row is added for it", () => {
    const next = addToGovernment(100, BUCKETS_PENDING, HISTORY_PENDING);

    expect(next.history).toHaveLength(3);
    expect(next.history[0]).toMatchObject({ description: "Funds added", amount: 100 });
    expect(next.history[1]).toEqual(HISTORY[0]);
    expect(next.history[2]).toEqual(paid(PHYSIO, TODAY));
    expect(next.history[2]!.pending).toBeUndefined();
  });

  it("[FAM-UI-05][AC-14] adding $50 is not enough for $310: $290 left and the cost stays pending", () => {
    const next = addToGovernment(50, BUCKETS_PENDING, HISTORY_PENDING);

    expect(next.buckets[2]).toMatchObject({
      total: 3050,
      used: 2760,
      remaining: 290,
      pendingTotal: 310,
      pendingCount: 1,
    });
    expect(next.history[2]).toEqual(PHYSIO);
  });

  it("[FAM-UI-05][AC-14] strictly oldest first: when the older cost does not fit, the newer one is not paid either, even though it would fit", () => {
    const newer = pendingCost("fund-pending-2", 90, "2026-11-10", "Occupational therapy");
    const history = [newer, HISTORY[0]!, PHYSIO];
    const next = addToGovernment(50, governmentPending(400, 2), history);

    expect(next.buckets[2]).toMatchObject({ remaining: 290, pendingTotal: 400, pendingCount: 2 });
    expect(next.history.slice(1)).toEqual(history);
  });

  it("[FAM-UI-05][AC-14] pays each cost in date order while the balance covers it, and stops at the first that does not fit", () => {
    const oldest = pendingCost("fund-pending-a", 200, "2026-10-01", "Respite");
    const middle = pendingCost("fund-pending-b", 90, "2026-10-20", "Transport");
    const newest = pendingCost("fund-pending-c", 500, "2026-11-10", "Equipment");
    // History is newest first, as the contract gives it.
    const history = [newest, middle, oldest];
    const next = addToGovernment(100, governmentPending(790, 3), history);

    // 240 + 100 = 340; 340 - 200 = 140; 140 - 90 = 50; 500 does not fit.
    expect(next.buckets[2]).toMatchObject({
      used: 3050,
      remaining: 50,
      pendingTotal: 500,
      pendingCount: 1,
    });
    expect(next.history.slice(1)).toEqual([newest, paid(middle, TODAY), paid(oldest, TODAY)]);
  });

  it("[FAM-UI-05][AC-14] a later, smaller cost is still paid once the older ones are", () => {
    const older = pendingCost("fund-pending-a", 300, "2026-10-01", "Respite");
    const newer = pendingCost("fund-pending-b", 20, "2026-11-01", "Transport");
    const next = addToGovernment(100, governmentPending(320, 2), [newer, older]);

    // 340 - 300 = 40; 40 - 20 = 20.
    expect(next.buckets[2]!.remaining).toBe(20);
    expect(next.history.slice(1)).toEqual([paid(newer, TODAY), paid(older, TODAY)]);
  });

  it("[FAM-UI-05][AC-14] a cost that exactly uses up the balance is paid, leaving $0 and an exhausted bucket", () => {
    const next = addToGovernment(70, BUCKETS_PENDING, HISTORY_PENDING);

    expect(next.buckets[2]).toMatchObject({ remaining: 0, percentUsed: 100, state: "exhausted" });
    expect(next.history[2]).toEqual(paid(PHYSIO, TODAY));
  });

  it("[FAM-UI-05][PRD] two pending costs on the same day: the one recorded first (lower in History) is the older", () => {
    const first = pendingCost("fund-pending-a", 150, "2026-10-27", "Respite");
    const second = pendingCost("fund-pending-b", 200, "2026-10-27", "Transport");
    const next = addToGovernment(10, governmentPending(350, 2), [second, first]);

    // 250 - 150 = 100; 200 does not fit.
    expect(next.buckets[2]).toMatchObject({ remaining: 100, pendingTotal: 200, pendingCount: 1 });
    expect(next.history.slice(1)).toEqual([second, paid(first, TODAY)]);
  });

  it("[FAM-UI-05][PRD] an overspent bucket pays nothing until it is back above the cost", () => {
    const buckets = governmentPending(100, 1, { total: 3000, used: 3050, remaining: -50 });
    const cost = pendingCost("fund-pending-1", 100, "2026-10-27");
    const next = addToGovernment(100, buckets, [cost]);

    expect(next.buckets[2]).toMatchObject({ remaining: 50, pendingTotal: 100, pendingCount: 1 });
    expect(next.history[1]).toEqual(cost);
  });

  it("[FAM-UI-05][PRD] only funds added pay: removing funds, renaming, or adding to another bucket leaves the cost pending", () => {
    let edit = withBucket(noChange(BUCKETS_PENDING), 2, { direction: "remove", amount: 40 });
    edit = withBucket(edit, 2, { name: "Government subsidy" });
    edit = withBucket(edit, 0, { amount: 5000 });
    const next = apply(edit, BUCKETS_PENDING, HISTORY_PENDING);

    expect(next.buckets[2]).toMatchObject({ remaining: 200, pendingTotal: 310, pendingCount: 1 });
    expect(next.history.find((row) => row.id === PHYSIO.id)).toEqual(PHYSIO);
  });

  it("[FAM-UI-05][PRD] only that bucket's costs are paid: a pending cost on NDIS stays when Government gains funds", () => {
    const ndisCost = pendingCost("fund-pending-ndis", 10, "2026-09-01", "Taxi", "bucket-ndis");
    const buckets = [
      { ...BUCKETS[0]!, pendingTotal: 10, pendingCount: 1 },
      BUCKETS[1]!,
      BUCKETS_PENDING[2]!,
    ];
    const next = addToGovernment(1000, buckets, [PHYSIO, ndisCost]);

    expect(next.buckets[0]).toEqual(buckets[0]);
    expect(next.history.slice(1)).toEqual([paid(PHYSIO, TODAY), ndisCost]);
  });

  it("[FAM-UI-05][PRD] pays in cents, so no floating-point residue reaches the card", () => {
    const buckets = [
      bucket("b-1", undefined, "Council grant", 100.1, 0, { pendingTotal: 0.3, pendingCount: 1 }),
    ];
    const cost = pendingCost("fund-pending-1", 0.3, "2026-10-27", "Stamps", "b-1");
    const next = apply(withBucket(noChange(buckets), 0, { amount: 0.2 }), buckets, [cost]);

    expect(next.buckets[0]).toMatchObject({ total: 100.3, used: 0.3, remaining: 100 });
    expect(next.buckets[0]!.pendingTotal ?? 0).toBe(0);
  });

  it("[FAM-UI-05][PRD] changes nothing it was given when it pays: the old History rows are new objects", () => {
    const buckets = structuredClone(BUCKETS_PENDING);
    const history = structuredClone(HISTORY_PENDING);

    applyBudgetEdit({ buckets, history }, withBucket(noChange(buckets), 2, { amount: 100 }), SAVE);

    expect(buckets).toEqual(BUCKETS_PENDING);
    expect(history).toEqual(HISTORY_PENDING);
  });
});

/*
 * CHG-022 (PD-060): every row a save makes states who made it ("you" in
 * Phase 1, with no signed-in user) and keeps the save's note, if any, in
 * `note`. Funds rows also keep the note as their description (PD-059).
 */
describe("[FAM-UI-05][AC-16] applyBudgetEdit records who made each row and keeps the note (CHG-022)", () => {
  function everyKindOfRow(note?: string) {
    const buckets = [...BUCKETS, COUNCIL];
    let edit = withBucket(noChange(buckets), 0, { amount: 500 });
    edit = withBucket(edit, 1, { direction: "remove", amount: 50 });
    edit = withBucket(edit, 3, { remove: true });
    return apply({ ...edit, added: [{ name: "Family gift", startingAmount: 20 }], note }, buckets);
  }

  it("[FAM-UI-05][AC-16] funds added, funds removed, bucket removed and bucket added rows each say 'you' recorded them", () => {
    const next = everyKindOfRow();

    expect(next.history.slice(0, 4).map((row) => [row.description, row.recordedBy])).toEqual([
      ["Funds added", "you"],
      ["Funds removed", "you"],
      ["Bucket removed", "you"],
      ["Bucket added", "you"],
    ]);
  });

  it("[FAM-UI-05][AC-16] with the note 'Q3 plan review', every row of the save keeps it; funds rows also use it as their description", () => {
    const next = everyKindOfRow("Q3 plan review");

    expect(next.history.slice(0, 4).map((row) => [row.description, row.note])).toEqual([
      ["Q3 plan review", "Q3 plan review"],
      ["Q3 plan review", "Q3 plan review"],
      ["Bucket removed", "Q3 plan review"],
      ["Bucket added", "Q3 plan review"],
    ]);
  });

  it("[FAM-UI-05][AC-16] with no note, the rows have no note", () => {
    const next = everyKindOfRow();

    expect(next.history.slice(0, 4).every((row) => row.note === undefined)).toBe(true);
  });

  it("[FAM-UI-05][AC-16] rows from before the save keep their own recorder and gain no note", () => {
    const next = everyKindOfRow("Q3 plan review");

    expect(next.history[4]).toEqual(HISTORY[0]);
  });

  it("[FAM-UI-05][AC-16] a pending cost paid by the save keeps its own recorder and gains no note", () => {
    const next = apply(
      { ...withBucket(noChange(BUCKETS_PENDING), 2, { amount: 100 }), note: "Top-up" },
      BUCKETS_PENDING,
      HISTORY_PENDING,
    );

    expect(next.history[2]).toEqual(paid(PHYSIO, TODAY));
    expect(next.history[2]!.recordedBy).toBe("Aisha Rahman");
    expect(next.history[2]!.note).toBeUndefined();
  });
});
