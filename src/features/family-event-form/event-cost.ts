import { z } from "zod";

import { fieldErrors } from "@/components/shared/forms";
import type { BudgetBucketSummary, CareEvent } from "@/types/domain";

/**
 * The Cost and Paid from fields (FAM-UI-08, PD-058). Phase 1: form state only,
 * saving is FAM-06 / FAM-07. The cost is held as the text the person typed
 * (`"90"`, `"$90.00"`) so nothing is reformatted under their cursor.
 */
export interface EventCostValues {
  cost: string;
  bucketId: string;
}

/** No cost and no bucket: the event costs nothing. */
export const EMPTY_EVENT_COST: EventCostValues = { cost: "", bucketId: "" };

/** Dollars with cents, `$14,880.00` (the kit's `formatMoney` rounds to whole dollars). */
export function formatDollars(amount: number): string {
  return `$${amount.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Opening values for Edit event: the event's saved cost and bucket, or none. */
export function costValuesFromEvent(
  event: Pick<CareEvent, "cost" | "bucketId"> | undefined,
): EventCostValues {
  if (event?.cost === undefined) return EMPTY_EVENT_COST;
  return { cost: formatDollars(event.cost), bucketId: event.bucketId ?? "" };
}

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/** The typed cost as dollars: `$` and thousands commas allowed. Undefined when not a valid amount. */
export function parseAmount(text: string): number | undefined {
  const plain = text.trim().replace(/^\$/, "").replaceAll(",", "");
  if (!AMOUNT_PATTERN.test(plain)) return undefined;
  const amount = Number(plain);
  return amount > 0 ? amount : undefined;
}

/** True when a cost has been typed at all, valid or not. */
export function hasCostText(values: EventCostValues): boolean {
  return values.cost.trim() !== "";
}

/** What the form holds once valid: the amount and the bucket. Undefined for no cost. */
export function parseEventCost(
  values: EventCostValues,
): { amount: number; bucketId: string } | undefined {
  const amount = parseAmount(values.cost);
  if (amount === undefined) return undefined;
  return { amount, bucketId: values.bucketId };
}

/**
 * A bucket can take new costs only with money left and nothing pending; a
 * pending cost means the bucket has already run short (PD-058).
 */
export function isBucketOpen(bucket: BudgetBucketSummary): boolean {
  return bucket.remaining > 0 && (bucket.pendingCount ?? 0) === 0;
}

const COST_MESSAGE = "Enter a cost above $0, with no more than 2 decimals.";
const NO_BUCKET_MESSAGE = "Choose the bucket that pays for this cost.";
const NO_FUNDS_MESSAGE =
  "No bucket has funds left, so this cost can't be saved. Clear the cost to save.";
const UNKNOWN_BUCKET_MESSAGE = "Choose a bucket from the list.";

/**
 * Cost is optional; once one is typed it must be an amount above $0 with at most
 * 2 decimals, and a bucket is required (AC-02). Clearing the cost clears the
 * requirement. Messages are keyed by `cost` and `bucketId`; `{}` means valid.
 */
export function validateEventCost(
  values: EventCostValues,
  buckets: BudgetBucketSummary[],
): Record<string, string> {
  const schema = z
    .object({ cost: z.string(), bucketId: z.string() })
    .superRefine((input, context) => {
      if (input.cost.trim() === "") return;
      if (parseAmount(input.cost) === undefined) {
        context.addIssue({ code: "custom", path: ["cost"], message: COST_MESSAGE });
      }
      if (input.bucketId === "") {
        const anyOpen = buckets.some(isBucketOpen);
        context.addIssue({
          code: "custom",
          path: ["bucketId"],
          message: anyOpen ? NO_BUCKET_MESSAGE : NO_FUNDS_MESSAGE,
        });
      } else if (!buckets.some((bucket) => bucket.id === input.bucketId)) {
        context.addIssue({ code: "custom", path: ["bucketId"], message: UNKNOWN_BUCKET_MESSAGE });
      }
    });
  const result = fieldErrors(schema, values);
  return result.ok ? {} : result.errors;
}
