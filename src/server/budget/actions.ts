"use server";

/**
 * `budget` domain Server Actions (FAM-11). `saveBudgetEdit` applies one whole Edit budget save through the
 * `save_budget_edit` database function, so the save is one transaction: every field right, or nothing written
 * (PD-059). Validated with Zod at the trust boundary (ARCHITECTURE.md §12.4); result shape per
 * ARCHITECTURE.md §4, never throwing to the page. Authority is the database's (`can_edit_budget`): this
 * action is not the only lock.
 *
 * Reading the budget stays in `queries.ts`.
 */
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getDataSourceMode } from "@/server/data-source";
import { refreshCachedPages } from "@/server/refresh-cache";

export interface BudgetEditInput {
  buckets: {
    id: string;
    name: string;
    direction: "add" | "remove";
    amount: number;
    remove: boolean;
  }[];
  added: { name: string; startingAmount: number }[];
  note?: string;
}

export type BudgetActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "VALIDATION" | "NOT_ALLOWED" | "NOT_AVAILABLE" | "UNEXPECTED";
        message: string;
        /** Message per wrong field, keyed `buckets.<i>.amount|name|remove` and `added.<i>.name|startingAmount`. */
        fields?: Record<string, string>;
      };
    };

const NOT_AVAILABLE_MESSAGE = "The budget can’t be saved yet.";
const NOT_ALLOWED_MESSAGE =
  "Only the client’s family or their organisation’s admins can change the budget.";
const GENERAL_MESSAGE = "Couldn’t save the budget. Try again.";
const RELOAD_MESSAGE =
  "The budget has changed since you opened this page. Reload the page and try again.";

const AMOUNT_LIMIT = 10_000_000_000;

/** More than 0 (or 0 for "no change"), under $10,000,000,000, at most 2 decimals. */
const isDollars = (value: number) =>
  Number.isFinite(value) &&
  value >= 0 &&
  value < AMOUNT_LIMIT &&
  Math.abs(Math.round(value * 100) - value * 100) < 1e-6;

// `z.guid()`, not `z.uuid()`: Postgres accepts any 8-4-4-4-12 hex id and seed ids carry no RFC version bits.
const SaveInputSchema = z.object({
  clientId: z.guid(),
  edit: z.object({
    buckets: z.array(
      z.object({
        id: z.guid(),
        name: z.string().trim().min(1, "Enter a name.").max(40, "Use 40 characters or fewer."),
        direction: z.enum(["add", "remove"]),
        amount: z
          .number()
          .refine(
            isDollars,
            "Enter an amount in dollars, up to 2 decimal places, under $10,000,000,000.",
          ),
        remove: z.boolean(),
      }),
    ),
    added: z.array(
      z.object({
        name: z.string().trim().min(1, "Enter a name.").max(40, "Use 40 characters or fewer."),
        startingAmount: z
          .number()
          .refine(isDollars, "Enter an amount of $0 or more, up to 2 decimal places."),
      }),
    ),
    note: z.string().optional(),
  }),
});

/** The only paths the database reports: the page's own field keys. */
const FIELD_PATH = /^(buckets\.\d+\.(amount|name|remove)|added\.\d+\.(name|startingAmount))$/;

/**
 * Saves the whole Edit budget page for `clientId` in one transaction. Who may: the client's family and their
 * organisation's admins (the database decides). `DATA_SOURCE=mock` returns `NOT_AVAILABLE`: nothing persists.
 */
async function saveBudgetEditImpl(
  clientId: string,
  edit: BudgetEditInput,
): Promise<BudgetActionResult> {
  if (getDataSourceMode() === "mock") {
    return { ok: false, error: { code: "NOT_AVAILABLE", message: NOT_AVAILABLE_MESSAGE } };
  }

  const parsed = SaveInputSchema.safeParse({ clientId, edit });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      // Drop the leading "edit" segment: the page's keys start at `buckets` or `added`.
      const path = issue.path.slice(1).join(".");
      if (FIELD_PATH.test(path) && !(path in fields)) fields[path] = issue.message;
    }
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the highlighted fields.",
        ...(Object.keys(fields).length > 0 && { fields }),
      },
    };
  }

  try {
    const supabase = await createClient();
    const { buckets, added, note } = parsed.data.edit;
    const { error } = await supabase.rpc("save_budget_edit", {
      p_client_id: parsed.data.clientId,
      p_buckets: buckets.map(({ id, name, direction, amount, remove }) => ({
        id,
        name,
        direction,
        amount,
        remove,
      })),
      p_added: added.map(({ name, startingAmount }) => ({
        name,
        starting_amount: startingAmount,
      })),
      // The generated type omits null for a defaulted argument; the database takes it.
      p_note: (note?.trim() || null) as string | undefined,
    });

    if (!error) return { ok: true, data: undefined };

    if (error.code === "42501") {
      return { ok: false, error: { code: "NOT_ALLOWED", message: NOT_ALLOWED_MESSAGE } };
    }
    if (error.code === "22023" || error.code === "23505") {
      const path = (error.details ?? "").trim();
      if (FIELD_PATH.test(path)) {
        return {
          ok: false,
          error: {
            code: "VALIDATION",
            message: "Check the highlighted fields.",
            fields: { [path]: error.message },
          },
        };
      }
      // A refusal with no field (a bucket removed by someone else meanwhile): say nothing of the cause.
      return { ok: false, error: { code: "UNEXPECTED", message: RELOAD_MESSAGE } };
    }
    console.error("[budget] saveBudgetEdit failed:", error.code ?? "unknown");
    return { ok: false, error: { code: "UNEXPECTED", message: GENERAL_MESSAGE } };
  } catch (error) {
    // A feature tag and the error's class only: the message may carry client data (ARCHITECTURE.md §12.5).
    console.error(
      "[budget] saveBudgetEdit failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: { code: "UNEXPECTED", message: GENERAL_MESSAGE } };
  }
}

export async function saveBudgetEdit(
  ...args: Parameters<typeof saveBudgetEditImpl>
): ReturnType<typeof saveBudgetEditImpl> {
  const result = await saveBudgetEditImpl(...args);
  if ((result as { ok?: boolean }).ok !== false) refreshCachedPages();
  return result;
}
