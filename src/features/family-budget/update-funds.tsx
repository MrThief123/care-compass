"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { ChipGroup, Field, type FieldErrors } from "@/components/shared/forms";
import { Button } from "@/components/ui/button";
import { formatDollars } from "@/features/family-home/home-format";
import { cn } from "@/lib/utils";
import type { BudgetBucketSummary } from "@/types/domain";

import {
  validateFundUpdate,
  type FundDirection,
  type FundUpdate,
  type FundUpdateValues,
} from "./fund-update";

export interface UpdateFundsProps {
  /** The buckets as on screen, so a removal is limited to what the card shows. */
  buckets: BudgetBucketSummary[];
  /** Applies a checked update to the screen's local state. */
  onSave: (update: FundUpdate) => void;
}

const EMPTY_VALUES: FundUpdateValues = { bucket: "", direction: "add", amount: "", note: "" };

const CHANGE_OPTIONS = [
  { value: "add", label: "Add" },
  { value: "remove", label: "Remove" },
];

/**
 * The 'Update' button, the simple Update form it opens inline, and the line
 * that says what a save changed (CHG-020, PD-058, DECISIONS.md FD-11), as
 * items for the Funds card's wrapping header row. The form is a bucket, Add or
 * Remove, an amount and an optional note; it is dated today, so it has no date.
 *
 * Focus: opening moves it to the bucket, a refused save to the first field to
 * fix, and Save, Cancel or Escape give it back to 'Update'. The live region is
 * on the page from the start, so a message put in it is announced.
 */
export function UpdateFunds({ buckets, onSave }: UpdateFundsProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const buttonId = useId();
  const formId = useId();

  function close(saved?: string) {
    setOpen(false);
    if (saved) setMessage(saved);
    document.getElementById(buttonId)?.focus();
  }

  return (
    <>
      <Button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={open ? formId : undefined}
        onClick={() => {
          setMessage("");
          setOpen(true);
        }}
      >
        Update
      </Button>
      {open && (
        <UpdateFundsForm
          id={formId}
          buckets={buckets}
          onSave={(update) => {
            onSave(update);
            const label = buckets[update.bucketIndex]?.label ?? "the bucket";
            const amount = formatDollars(update.amount);
            close(
              update.direction === "add"
                ? `${amount} added to ${label}.`
                : `${amount} removed from ${label}.`,
            );
          }}
          onCancel={() => close()}
        />
      )}
      <p
        role="status"
        className={cn("basis-full text-body-small text-text-secondary", message && "mt-2")}
      >
        {message || null}
      </p>
    </>
  );
}

interface UpdateFundsFormProps {
  id: string;
  buckets: BudgetBucketSummary[];
  onSave: (update: FundUpdate) => void;
  onCancel: () => void;
}

function UpdateFundsForm({ id, buckets, onSave, onCancel }: UpdateFundsFormProps) {
  const [values, setValues] = useState<FundUpdateValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  // Bumped by each refused save, so focus moves even when the errors are the same.
  const [refusals, setRefusals] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const headingId = useId();

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("select")?.focus();
  }, []);

  useEffect(() => {
    if (refusals > 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [refusals]);

  function change<K extends keyof FundUpdateValues>(key: K, value: FundUpdateValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateFundUpdate(values, buckets);
    if (result.ok) {
      onSave(result.data);
      return;
    }
    setErrors(result.errors);
    setRefusals((count) => count + 1);
  }

  return (
    <form
      id={id}
      ref={formRef}
      noValidate
      aria-labelledby={headingId}
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
      className="mt-2 flex basis-full flex-col gap-4 rounded-card border border-border-subtle bg-bg-surface p-4"
    >
      <h3 id={headingId} className="text-body-default font-medium text-text-primary">
        Update funds
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] items-start gap-4">
        <Field
          type="select"
          label="Bucket"
          value={values.bucket}
          onChange={(value) => change("bucket", value)}
          options={[
            { value: "", label: "Choose a bucket" },
            ...buckets.map((bucket, index) => ({ value: String(index), label: bucket.label })),
          ]}
          error={errors.bucket}
          className="min-w-0"
        />
        <ChipGroup
          legend="Change"
          options={CHANGE_OPTIONS}
          value={values.direction}
          onChange={(value) => change("direction", value as FundDirection)}
          className="min-w-0"
        />
        <Field
          label="Amount"
          value={values.amount}
          onChange={(value) => change("amount", value)}
          error={errors.amount}
          className="min-w-0"
        />
        <Field
          label="Note (optional)"
          value={values.note}
          onChange={(value) => change("note", value)}
          className="min-w-0"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
