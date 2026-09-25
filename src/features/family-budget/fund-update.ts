/**
 * The simplified Update form's rules (CHG-020, PD-058, DECISIONS.md FD-11):
 * what it accepts, and the change a saved update makes to the screen's own
 * copy of the buckets and History. Phase 1: local state only, nothing is
 * written anywhere and a reload shows the fixtures again.
 */
import { z } from "zod";

import { fieldErrors, type ValidationResult } from "@/components/shared/forms";
import { formatDollars } from "@/features/family-home/home-format";
import type { BudgetBucketState, BudgetBucketSummary, FundEntry } from "@/types/domain";

export type FundDirection = "add" | "remove";

/** The form's values as typed: `bucket` is the bucket's index as a string, "" for none. */
export interface FundUpdateValues {
  bucket: string;
  direction: FundDirection;
  amount: string;
  note: string;
}

/** A checked update, ready to apply. */
export interface FundUpdate {
  bucketIndex: number;
  direction: FundDirection;
  /** Dollars, more than 0, at most 2 decimal places. */
  amount: number;
  note?: string;
}

export interface FundState {
  buckets: BudgetBucketSummary[];
  /** Newest first. */
  history: FundEntry[];
}

/** What the new History row is stamped with. */
export interface FundRowContext {
  clientId: string;
  /** The reference day, `YYYY-MM-DD` (`getToday`). */
  date: string;
  id: string;
}

export const FUND_UPDATE_MESSAGES = {
  bucket: "Choose a bucket.",
  amountEmpty: "Enter an amount.",
  amountNotPositive: "Enter an amount more than $0.",
  amountDecimals: "Use no more than 2 decimal places.",
  amountFormat: "Enter an amount in dollars, like 250 or 250.50.",
  amountTooLarge: "Enter an amount under $10,000,000,000.",
} as const;

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

/** "$1,250.75" → 125075 cents, or the message for why it is not an amount. */
function parseAmountCents(input: string): number | string {
  const trimmed = input.trim();
  if (trimmed === "") return FUND_UPDATE_MESSAGES.amountEmpty;
  const text = trimmed.replace(/^(-?)\$/, "$1");
  if (!AMOUNT_PATTERN.test(text)) return FUND_UPDATE_MESSAGES.amountFormat;
  const plain = text.replaceAll(",", "");
  if (Number(plain) <= 0) return FUND_UPDATE_MESSAGES.amountNotPositive;
  if ((plain.split(".")[1] ?? "").length > 2) return FUND_UPDATE_MESSAGES.amountDecimals;
  const cents = toCents(Number(plain));
  if (cents >= AMOUNT_LIMIT_CENTS) return FUND_UPDATE_MESSAGES.amountTooLarge;
  return cents;
}

function fundUpdateSchema(buckets: BudgetBucketSummary[]): z.ZodType<FundUpdate> {
  return z
    .object({
      bucket: z.string().transform((value, ctx) => {
        const index = /^\d+$/.test(value) ? Number(value) : -1;
        if (index < 0 || index >= buckets.length) {
          ctx.addIssue({ code: "custom", message: FUND_UPDATE_MESSAGES.bucket });
          return z.NEVER;
        }
        return index;
      }),
      direction: z.enum(["add", "remove"]),
      amount: z.string().transform((value, ctx) => {
        const cents = parseAmountCents(value);
        if (typeof cents === "string") {
          ctx.addIssue({ code: "custom", message: cents });
          return z.NEVER;
        }
        return cents;
      }),
      note: z.string().transform((value) => value.trim() || undefined),
    })
    .transform((values, ctx) => {
      if (values.direction === "remove") {
        // An empty or overspent bucket has nothing to remove.
        const availableCents = Math.max(0, toCents(buckets[values.bucket]!.remaining));
        if (values.amount > availableCents) {
          ctx.addIssue({
            code: "custom",
            path: ["amount"],
            message: `Only ${formatDollars(availableCents / 100)} available`,
          });
          return z.NEVER;
        }
      }
      return {
        bucketIndex: values.bucket,
        direction: values.direction,
        amount: values.amount / 100,
        note: values.note,
      };
    });
}

/**
 * Checks the form against the buckets on screen. Every wrong field is reported
 * at once, one message each; a removal is limited to the bucket's balance, an
 * addition is not.
 */
export function validateFundUpdate(
  values: FundUpdateValues,
  buckets: BudgetBucketSummary[],
): ValidationResult<FundUpdate> {
  return fieldErrors(fundUpdateSchema(buckets), values);
}

/**
 * The screen's state after a saved update, as new objects (the inputs are not
 * changed). The chosen bucket's total moves by the amount, so `used` stays and
 * `remaining`, `percentUsed` and `state` are worked out again, in cents. Its
 * pending costs are kept: paying them is F0-12's. History gains a first row
 * dated today, described by the note or "Funds added" / "Funds removed". It
 * names no recorder: Phase 1 has no signed-in user (FAM-11 records one).
 */
export function applyFundUpdate(
  state: FundState,
  update: FundUpdate,
  row: FundRowContext,
): FundState {
  const target = state.buckets[update.bucketIndex];
  if (!target) return state;

  const adding = update.direction === "add";
  const deltaCents = (adding ? 1 : -1) * toCents(update.amount);
  const totalCents = toCents(target.total) + deltaCents;
  const usedCents = toCents(target.used);
  const percentUsed = totalCents === 0 ? 0 : Math.round((usedCents / totalCents) * 100);

  const buckets = state.buckets.map((bucket, index) =>
    index === update.bucketIndex
      ? {
          ...bucket,
          total: totalCents / 100,
          remaining: (totalCents - usedCents) / 100,
          percentUsed,
          state: bucketState(percentUsed),
        }
      : bucket,
  );

  const entry: FundEntry = {
    id: row.id,
    clientId: row.clientId,
    bucketKind: target.kind,
    type: adding ? "topup" : "expense",
    amount: deltaCents / 100,
    date: row.date,
    description: update.note || (adding ? "Funds added" : "Funds removed"),
  };

  return { buckets, history: [entry, ...state.history] };
}
