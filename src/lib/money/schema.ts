/**
 * Money arriving from a client is a decimal string, never a JavaScript number (F0-12, REQ-N12): at most
 * 2 decimal places and inside numeric(12,2). The database validates again (`budget_check_amount`), and
 * all arithmetic stays in SQL. `src/features/family-budget/budget-edit.ts` parses the form's own text
 * (commas, a leading "$") for display messages; this is the strict server-side twin.
 */
import { z } from "zod";

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;
const LIMIT = 10_000_000_000;

function isMoneyString(value: string): boolean {
  return DECIMAL_PATTERN.test(value) && Number(value) < LIMIT;
}

/** An amount of $0 or more, e.g. a starting amount: "0", "12.5", "12.50". */
export const moneySchema = z
  .string()
  .refine(isMoneyString, "Enter an amount in dollars with at most 2 decimal places.");

/** An amount more than $0, e.g. funds added or removed. */
export const positiveMoneySchema = moneySchema.refine(
  (value) => Number(value) > 0,
  "Enter an amount more than $0.",
);
