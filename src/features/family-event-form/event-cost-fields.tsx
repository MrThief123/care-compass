"use client";

import { useId } from "react";

import { Field, InlineAlert } from "@/components/shared/forms";
import { cn } from "@/lib/utils";
import type { BudgetBucketSummary, RecurrenceFrequency } from "@/types/domain";

import {
  formatDollars,
  hasCostText,
  isBucketOpen,
  parseAmount,
  type EventCostValues,
} from "./event-cost";

export interface EventCostFieldsProps {
  values: EventCostValues;
  onChange: (values: EventCostValues) => void;
  buckets: BudgetBucketSummary[];
  /** The form's Recurring value: a recurring cost is charged each time (AC-05). */
  recurrence: RecurrenceFrequency;
  /** Messages keyed `cost` and `bucketId` (`validateEventCost`). */
  errors?: { cost?: string; bucketId?: string };
  /** Edit event on an event that already has a cost: say a change is for later (AC-06). */
  hasSavedCost?: boolean;
}

/**
 * The optional Cost field and the Paid from bucket picker (FAM-UI-08, PD-058).
 * Built here, not in the shared kit: `ChipGroup` cannot strike an option
 * through or say why. A bucket with no money left or a pending cost is struck
 * through, says "No funds left" in words, and is a disabled radio, so neither
 * a click nor the arrow keys can choose it. A saved bucket that has since
 * closed stays selected. Choosing a bucket the cost exceeds only warns.
 */
export function EventCostFields({
  values,
  onChange,
  buckets,
  recurrence,
  errors,
  hasSavedCost = false,
}: EventCostFieldsProps) {
  const groupName = useId();
  const legendId = `${groupName}-legend`;
  const noteId = `${groupName}-note`;
  const errorId = `${groupName}-error`;

  const amount = parseAmount(values.cost);
  const chosen = buckets.find((bucket) => bucket.id === values.bucketId);
  const overdrawn =
    amount !== undefined && chosen && amount > chosen.remaining ? chosen : undefined;
  const noneOpen = !buckets.some(isBucketOpen);
  const describedBy =
    [errors?.bucketId ? errorId : null, noneOpen ? noteId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Cost"
        value={values.cost}
        onChange={(cost) => onChange({ ...values, cost })}
        hint="In dollars. Leave empty if it costs nothing."
        error={errors?.cost}
      />

      <div className="flex flex-col gap-2">
        <span id={legendId} className="text-body-default text-text-secondary">
          Paid from
        </span>
        <div
          role="radiogroup"
          aria-labelledby={legendId}
          aria-describedby={describedBy}
          aria-invalid={errors?.bucketId ? true : undefined}
          className="flex flex-col gap-2"
        >
          {buckets.map((bucket) => {
            const open = isBucketOpen(bucket);
            return (
              <label
                key={bucket.id}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-control border bg-bg-surface px-3 py-2",
                  "has-[:checked]:bg-bg-inset has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                  errors?.bucketId ? "border-border-alert" : "border-border-brand",
                  open ? "cursor-pointer" : "cursor-not-allowed",
                )}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={bucket.id}
                  checked={values.bucketId === bucket.id}
                  disabled={!open}
                  onChange={() => onChange({ ...values, bucketId: bucket.id })}
                  className="size-5 shrink-0 accent-primary"
                />
                <span
                  className={cn(
                    "text-body-emphasis",
                    open ? "text-text-primary" : "text-text-secondary line-through",
                  )}
                >
                  {bucket.label}
                </span>
                <span className="ml-auto text-body-default text-text-secondary">
                  {open ? `${formatDollars(bucket.remaining)} left` : "No funds left"}
                </span>
              </label>
            );
          })}
        </div>
        {noneOpen && (
          <p id={noteId} className="text-body-small text-text-secondary">
            No bucket has funds left.
          </p>
        )}
        {errors?.bucketId && (
          <p id={errorId} className="text-body-small text-text-alert-strong">
            {errors.bucketId}
          </p>
        )}
      </div>

      {overdrawn && (
        <InlineAlert>
          This cost is more than the {overdrawn.label} balance of{" "}
          {formatDollars(overdrawn.remaining)}. It will be held as pending until funds are added.
        </InlineAlert>
      )}

      {hasCostText(values) && recurrence !== "none" && (
        <p className="text-body-small text-text-secondary">Charged each time it&apos;s completed</p>
      )}
      {hasSavedCost && (
        <p className="text-body-small text-text-secondary">
          A change applies to future completions only.
        </p>
      )}
    </div>
  );
}
