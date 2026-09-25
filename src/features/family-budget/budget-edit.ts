/**
 * The Edit budget page's rules (CHG-021, PD-059, DECISIONS.md FD-12): what it
 * starts from, what it refuses, and the change a save makes to the Budget
 * route's own copy of the buckets and History. Phase 1: local state only,
 * nothing is written anywhere and a reload shows the fixtures again. Replaces
 * the CHG-020 inline form's rules; the amount rules and the balance limit are
 * kept from it.
 */
import { z } from "zod";

import { fieldErrors, type ValidationResult } from "@/components/shared/forms";
import { formatDollars } from "@/features/family-home/home-format";
import type {
  BudgetBucketKind,
  BudgetBucketState,
  BudgetBucketSummary,
  FundEntry,
} from "@/types/domain";

export type FundDirection = "add" | "remove";

/** The page's values as typed. */
export interface BudgetEditValues {
  /** One row per saved bucket, in page order. */
  buckets: {
    id: string;
    name: string;
    direction: FundDirection;
    amount: string;
    /** Marked with 'Remove bucket'. */
    remove: boolean;
  }[];
  /** Buckets added with 'Add bucket', in page order. */
  added: { name: string; startingAmount: string }[];
  note: string;
}

/** A checked edit, ready to apply. Amounts are dollars. */
export interface BudgetEdit {
  buckets: {
    id: string;
    /** Trimmed. */
    name: string;
    direction: FundDirection;
    /** More than 0, or 0 for no change (and always 0 on a bucket being removed). */
    amount: number;
    remove: boolean;
  }[];
  added: { name: string; startingAmount: number }[];
  note?: string;
}

export interface BudgetState {
  buckets: BudgetBucketSummary[];
  /** Newest first. */
  history: FundEntry[];
}

/** What a save's new rows are stamped with. */
export interface BudgetSaveContext {
  clientId: string;
  /** The reference day, `YYYY-MM-DD` (`getToday`). */
  date: string;
  /** Which save this is (1, 2, …): keeps new ids unique across saves. */
  save: number;
}

export interface BudgetEditResult extends BudgetState {
  /** False when the save changed nothing, so nothing is announced. */
  changed: boolean;
}

export const BUDGET_EDIT_MESSAGES = {
  amountNotPositive: "Enter an amount more than $0.",
  amountDecimals: "Use no more than 2 decimal places.",
  amountFormat: "Enter an amount in dollars, like 250 or 250.50.",
  amountTooLarge: "Enter an amount under $10,000,000,000.",
  startingEmpty: "Enter a starting amount, or 0.",
  startingNegative: "Enter an amount of $0 or more.",
  nameEmpty: "Enter a name.",
  nameTooLong: "Use 40 characters or fewer.",
  nameTaken: "Another bucket already has this name.",
  removeSpent: "Money has been spent from this bucket, so it can’t be removed.",
  removePending: "This bucket has pending costs, so it can’t be removed.",
} as const;

export const NAME_MAX_LENGTH = 40;

/** PD-033's three buckets, offered as names for a new one (CHG-021). */
const SUGGESTIONS: { name: string; kind: BudgetBucketKind }[] = [
  { name: "NDIS", kind: "ndis" },
  { name: "Fixed", kind: "fixed" },
  { name: "Government", kind: "government" },
];

/** Money is `numeric(12,2)` (ARCHITECTURE.md §12): ten digits of dollars. */
const AMOUNT_LIMIT_CENTS = 10_000_000_000 * 100;

/** Digits with an optional sign and decimals; thousands commas only in their places. */
const AMOUNT_PATTERN = /^-?(\d+|\d{1,3}(,\d{3})+)(\.\d+)?$/;

/** PD-032, the same thresholds the contract derives a bucket's state with. */
function bucketState(percentUsed: number): BudgetBucketState {
  if (percentUsed >= 100) return "exhausted";
  if (percentUsed >= 85) return "alert";
  if (percentUsed >= 75) return "warning";
  return "ok";
}

function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Names compare ignoring case and the spaces around them. */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * "$1,250.75" → 125075 cents, or the message for why it is not an amount.
 * `allowZero` is for a starting amount, where 0 is a real choice.
 */
function parseAmountCents(trimmed: string, allowZero: boolean): number | string {
  const text = trimmed.replace(/^(-?)\$/, "$1");
  if (!AMOUNT_PATTERN.test(text)) return BUDGET_EDIT_MESSAGES.amountFormat;
  const plain = text.replaceAll(",", "");
  const value = Number(plain);
  if (allowZero ? value < 0 : value <= 0) {
    return allowZero
      ? BUDGET_EDIT_MESSAGES.startingNegative
      : BUDGET_EDIT_MESSAGES.amountNotPositive;
  }
  if ((plain.split(".")[1] ?? "").length > 2) return BUDGET_EDIT_MESSAGES.amountDecimals;
  const cents = toCents(value);
  if (cents >= AMOUNT_LIMIT_CENTS) return BUDGET_EDIT_MESSAGES.amountTooLarge;
  return cents;
}

function nameError(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed === "") return BUDGET_EDIT_MESSAGES.nameEmpty;
  if (trimmed.length > NAME_MAX_LENGTH) return BUDGET_EDIT_MESSAGES.nameTooLong;
  return undefined;
}

/** Why a saved bucket cannot be removed, or undefined when it can. Pending comes first. */
export function removalRefusal(bucket: BudgetBucketSummary): string | undefined {
  if ((bucket.pendingCount ?? 0) > 0) return BUDGET_EDIT_MESSAGES.removePending;
  if (bucket.used > 0) return BUDGET_EDIT_MESSAGES.removeSpent;
  return undefined;
}

/** The page's starting values: each bucket at its saved name, Add, a blank amount, kept. */
export function editValuesFor(buckets: BudgetBucketSummary[]): BudgetEditValues {
  return {
    buckets: buckets.map((bucket) => ({
      id: bucket.id,
      name: bucket.label,
      direction: "add",
      amount: "",
      remove: false,
    })),
    added: [],
    note: "",
  };
}

/** The suggested names not already in use, in their set order. */
export function nameSuggestions(namesInUse: string[]): string[] {
  const inUse = new Set(namesInUse.map(nameKey));
  return SUGGESTIONS.map((suggestion) => suggestion.name).filter(
    (name) => !inUse.has(nameKey(name)),
  );
}

const valuesSchema = z.object({
  buckets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      direction: z.enum(["add", "remove"]),
      amount: z.string(),
      remove: z.boolean(),
    }),
  ),
  added: z.array(z.object({ name: z.string(), startingAmount: z.string() })),
  note: z.string(),
});

function budgetEditSchema(saved: BudgetBucketSummary[]): z.ZodType<BudgetEdit> {
  return valuesSchema.transform((values, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    const buckets = values.buckets.map((row, index) => {
      const bucket = saved.find((candidate) => candidate.id === row.id) ?? saved[index];
      const name = row.name.trim();
      // A bucket being removed keeps nothing of what was typed for it.
      if (row.remove) {
        const refusal = bucket ? removalRefusal(bucket) : undefined;
        if (refusal) issue(["buckets", index, "remove"], refusal);
        return { id: row.id, name, direction: row.direction, amount: 0, remove: true };
      }

      const invalidName = nameError(row.name);
      if (invalidName) issue(["buckets", index, "name"], invalidName);

      let cents = 0;
      const typed = row.amount.trim();
      if (typed !== "") {
        const parsed = parseAmountCents(typed, false);
        if (typeof parsed === "string") {
          issue(["buckets", index, "amount"], parsed);
        } else if (row.direction === "remove" && bucket) {
          // An empty or overspent bucket has nothing to remove.
          const availableCents = Math.max(0, toCents(bucket.remaining));
          if (parsed > availableCents) {
            issue(
              ["buckets", index, "amount"],
              `Only ${formatDollars(availableCents / 100)} available`,
            );
          } else {
            cents = parsed;
          }
        } else {
          cents = parsed;
        }
      }
      return { id: row.id, name, direction: row.direction, amount: cents / 100, remove: false };
    });

    const added = values.added.map((row, index) => {
      const invalidName = nameError(row.name);
      if (invalidName) issue(["added", index, "name"], invalidName);

      let cents = 0;
      const typed = row.startingAmount.trim();
      if (typed === "") {
        issue(["added", index, "startingAmount"], BUDGET_EDIT_MESSAGES.startingEmpty);
      } else {
        const parsed = parseAmountCents(typed, true);
        if (typeof parsed === "string") issue(["added", index, "startingAmount"], parsed);
        else cents = parsed;
      }
      return { name: row.name.trim(), startingAmount: cents / 100 };
    });

    // Names in use after the save: kept buckets and new ones. Only a new or
    // renamed name is marked when it is taken, so saved buckets that already
    // share a name, unchanged, never stop a save.
    const kept = values.buckets
      .map((row, index) => ({
        row,
        index,
        bucket: saved.find((b) => b.id === row.id) ?? saved[index],
      }))
      .filter(({ row }) => !row.remove);
    const names = [
      ...kept.map(({ row, index }) => ({
        path: ["buckets", index, "name"],
        key: nameKey(row.name),
      })),
      ...values.added.map((row, index) => ({
        path: ["added", index, "name"],
        key: nameKey(row.name),
      })),
    ];
    const isChecked = (path: (string | number)[]) =>
      path[0] === "added" ||
      kept.some(({ row, index, bucket }) => index === path[1] && row.name.trim() !== bucket?.label);
    names.forEach((entry, position) => {
      if (entry.key === "" || !isChecked(entry.path)) return;
      const taken = names.some((other, at) => at !== position && other.key === entry.key);
      if (taken) issue(entry.path, BUDGET_EDIT_MESSAGES.nameTaken);
    });

    return { buckets, added, note: values.note.trim() || undefined };
  });
}

/**
 * Checks the page against the saved buckets. Every wrong field is reported at
 * once, one message each, keyed `buckets.<i>.amount|name|remove` and
 * `added.<i>.name|startingAmount`.
 */
export function validateBudgetEdit(
  values: BudgetEditValues,
  buckets: BudgetBucketSummary[],
): ValidationResult<BudgetEdit> {
  return fieldErrors(budgetEditSchema(buckets), values);
}

/** A bucket's figures worked out again, in cents, from its total and used. */
function withFigures(
  bucket: BudgetBucketSummary,
  totalCents: number,
  usedCents: number,
): BudgetBucketSummary {
  const percentUsed = totalCents === 0 ? 0 : Math.round((usedCents / totalCents) * 100);
  return {
    ...bucket,
    total: totalCents / 100,
    used: usedCents / 100,
    remaining: (totalCents - usedCents) / 100,
    percentUsed,
    state: bucketState(percentUsed),
  };
}

/** A bucket's figures with its total moved by `deltaCents`. */
function withTotalMoved(bucket: BudgetBucketSummary, deltaCents: number): BudgetBucketSummary {
  return withFigures(bucket, toCents(bucket.total) + deltaCents, toCents(bucket.used));
}

/**
 * History's costs still pending, oldest first by date; on the same day, the
 * one lower in History (recorded first) first. The order they are paid in,
 * and the Pending costs section's order (CHG-022, FD-13).
 */
export function pendingCosts(history: FundEntry[]): FundEntry[] {
  return history
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.pending)
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date) || b.index - a.index)
    .map(({ entry }) => entry);
}

/**
 * Pays `bucket`'s pending costs from `history` (CHG-022, PD-060): strictly
 * oldest first, each whole while the balance covers it, stopping at the first that does
 * not. Returns the bucket's new figures and the ids of the costs paid.
 */
function payPendingCosts(
  bucket: BudgetBucketSummary,
  history: FundEntry[],
): { bucket: BudgetBucketSummary; paidIds: Set<string> } {
  const costs = pendingCosts(history).filter((entry) => entry.bucketId === bucket.id);

  const totalCents = toCents(bucket.total);
  let usedCents = toCents(bucket.used);
  let pendingCents = toCents(bucket.pendingTotal ?? 0);
  let pendingCount = bucket.pendingCount ?? 0;
  const paidIds = new Set<string>();
  for (const entry of costs) {
    const costCents = Math.abs(toCents(entry.amount));
    if (costCents > totalCents - usedCents) break;
    usedCents += costCents;
    pendingCents -= costCents;
    pendingCount -= 1;
    paidIds.add(entry.id);
  }
  if (paidIds.size === 0) return { bucket, paidIds };

  const next = withFigures(bucket, totalCents, usedCents);
  delete next.pendingTotal;
  delete next.pendingCount;
  if (pendingCount > 0) Object.assign(next, { pendingTotal: pendingCents / 100, pendingCount });
  return { bucket: next, paidIds };
}

/**
 * The route's state after a saved edit, as new objects (the inputs are not
 * changed). Saved buckets are matched by id: a funds change moves the total,
 * and funds added then pay that bucket's pending costs (CHG-022), a rename
 * changes the label only, and a removed bucket goes. New buckets are added
 * last. History gains, above the old rows, one row per change in page order,
 * dated today, recorded by "you" (Phase 1 has no signed-in user) and keeping
 * the save's note. A paid cost keeps its row, no longer pending, paid today.
 */
export function applyBudgetEdit(
  state: BudgetState,
  edit: BudgetEdit,
  context: BudgetSaveContext,
): BudgetEditResult {
  const rows: FundEntry[] = [];
  let renamed = false;

  const addRow = (
    bucketId: string,
    type: FundEntry["type"],
    cents: number,
    description: string,
  ) => {
    rows.push({
      id: `fund-edit-${context.save}-${rows.length + 1}`,
      clientId: context.clientId,
      bucketId,
      type,
      // `|| 0` so a removed empty bucket reads 0, never -0.
      amount: cents / 100 || 0,
      date: context.date,
      description,
      recordedBy: "you",
      ...(edit.note && { note: edit.note }),
    });
  };

  // Saved buckets are walked in their order, which is the page's order.
  const buckets: BudgetBucketSummary[] = [];
  const paidIds = new Set<string>();
  for (const bucket of state.buckets) {
    const row = edit.buckets.find((candidate) => candidate.id === bucket.id);
    if (!row) {
      buckets.push(bucket);
      continue;
    }
    if (row.remove) {
      addRow(bucket.id, "expense", -toCents(bucket.remaining), "Bucket removed");
      continue;
    }
    let next = bucket;
    if (row.name && row.name !== bucket.label) {
      next = { ...next, label: row.name };
      renamed = true;
    }
    const cents = toCents(row.amount);
    if (cents > 0) {
      const adding = row.direction === "add";
      next = withTotalMoved(next, adding ? cents : -cents);
      addRow(
        bucket.id,
        adding ? "topup" : "expense",
        adding ? cents : -cents,
        edit.note || (adding ? "Funds added" : "Funds removed"),
      );
      if (adding) {
        const paying = payPendingCosts(next, state.history);
        next = paying.bucket;
        paying.paidIds.forEach((id) => paidIds.add(id));
      }
    }
    buckets.push(next);
  }

  edit.added.forEach((added, index) => {
    const id = `bucket-new-${context.save}-${index + 1}`;
    const kind = SUGGESTIONS.find(
      (suggestion) => nameKey(suggestion.name) === nameKey(added.name),
    )?.kind;
    const startingCents = toCents(added.startingAmount);
    buckets.push({
      id,
      ...(kind && { kind }),
      label: added.name,
      total: startingCents / 100,
      used: 0,
      remaining: startingCents / 100,
      percentUsed: 0,
      state: "ok",
    });
    addRow(id, "topup", startingCents, "Bucket added");
  });

  const changed = rows.length > 0 || renamed;
  if (!changed) return { buckets: state.buckets, history: state.history, changed };
  const history = state.history.map((entry) => {
    if (!paidIds.has(entry.id)) return entry;
    const paidEntry: FundEntry = { ...entry, paidOn: context.date };
    delete paidEntry.pending;
    return paidEntry;
  });
  return { buckets, history: [...rows, ...history], changed };
}
