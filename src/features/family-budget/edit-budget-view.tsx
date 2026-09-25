"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type SyntheticEvent } from "react";

import { ChipGroup, Field, type FieldErrors } from "@/components/shared/forms";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { formatDollars } from "@/features/family-home/home-format";
import { cn } from "@/lib/utils";
import type { BudgetBucketSummary } from "@/types/domain";

import {
  applyBudgetEdit,
  editValuesFor,
  nameSuggestions,
  removalRefusal,
  validateBudgetEdit,
  type BudgetEditValues,
  type FundDirection,
} from "./budget-edit";
import { useBudgetHolder, useHeldBudget } from "./budget-holder";

import type { FamilyBudgetData } from "./budget-data";

const CHANGE_OPTIONS = [
  { value: "add", label: "Add" },
  { value: "remove", label: "Remove" },
];

const TITLE_ID = "edit-budget-title";

type SavedRow = BudgetEditValues["buckets"][number];
/** A new bucket's values, with a key that stays with it while others are discarded. */
type AddedRow = BudgetEditValues["added"][number] & { key: number };

interface FormValues {
  buckets: SavedRow[];
  added: AddedRow[];
  note: string;
}

/**
 * Family · Edit budget (CHG-021, PD-059, DECISIONS.md FD-12): one panel per
 * saved bucket to rename it, add or remove funds, or remove it when nothing is
 * spent from it and nothing is pending; 'Add bucket' for new ones; one note for
 * the whole save. Save checks everything at once (`validateBudgetEdit`); a
 * refused save marks each field in error and focuses the first. A save that
 * passes is applied to the route's holder (local state only, Phase 1) and goes
 * back to Budget; Cancel and Escape go back with nothing changed.
 */
export function EditBudgetView({ clientId, data }: { clientId: string; data: FamilyBudgetData }) {
  const router = useRouter();
  const source = useHeldBudget(clientId, data);
  const { keep, nextSave } = useBudgetHolder();

  const [values, setValues] = useState<FormValues>(() => ({
    ...editValuesFor(source.buckets),
    added: [],
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [focusRequest, setFocusRequest] = useState<{ selector: string } | null>(null);
  const addedKeys = useRef(0);
  const form = useRef<HTMLFormElement>(null);

  // Focus follows the change it asks for: a new bucket's name, the other of
  // Remove/Keep bucket, or the first field in error.
  useEffect(() => {
    if (focusRequest) form.current?.querySelector<HTMLElement>(focusRequest.selector)?.focus();
  }, [focusRequest]);

  const budgetHref = `/family/${clientId}/budget`;

  function setBucket(index: number, change: Partial<SavedRow>) {
    setValues((current) => ({
      ...current,
      buckets: current.buckets.map((row, i) => (i === index ? { ...row, ...change } : row)),
    }));
  }

  function setAdded(key: number, change: Partial<AddedRow>) {
    setValues((current) => ({
      ...current,
      added: current.added.map((row) => (row.key === key ? { ...row, ...change } : row)),
    }));
  }

  function markRemoved(index: number, remove: boolean) {
    setBucket(index, { remove });
    setFocusRequest({ selector: `[name="bucket-${index}-${remove ? "keep" : "remove"}"]` });
  }

  function addBucket() {
    addedKeys.current += 1;
    const key = addedKeys.current;
    setValues((current) => ({
      ...current,
      added: [...current.added, { key, name: "", startingAmount: "" }],
    }));
    setFocusRequest({ selector: `[name="added-${key}-name"]` });
  }

  function discard(key: number) {
    setValues((current) => ({
      ...current,
      added: current.added.filter((row) => row.key !== key),
    }));
    // Messages are keyed by position, so they would land on the wrong bucket.
    setErrors({});
  }

  function cancel() {
    router.push(budgetHref);
  }

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateBudgetEdit(values, source.buckets);
    if (!result.ok) {
      setErrors(result.errors);
      setFocusRequest({ selector: '[aria-invalid="true"]' });
      return;
    }
    const next = applyBudgetEdit(source, result.data, {
      clientId,
      date: data.today,
      save: nextSave(),
    });
    if (next.changed) keep({ clientId, buckets: next.buckets, history: next.history }, true);
    router.push(budgetHref);
  }

  function onKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  }

  // A new bucket is offered the suggested names no other bucket is using.
  function suggestionsFor(key: number): string[] {
    return nameSuggestions([
      ...values.buckets.filter((row) => !row.remove).map((row) => row.name),
      ...values.added.filter((row) => row.key !== key).map((row) => row.name),
    ]);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 px-6 pb-6 pt-5">
      <h1 id={TITLE_ID} className="text-title-page text-text-primary">
        Edit budget
      </h1>
      <form
        ref={form}
        aria-labelledby={TITLE_ID}
        noValidate
        onSubmit={submit}
        onKeyDown={onKeyDown}
        className="flex min-w-0 flex-col gap-4"
      >
        {values.buckets.map((row, index) => {
          const bucket = source.buckets.find((candidate) => candidate.id === row.id);
          if (!bucket) return null;
          return (
            <SavedBucketPanel
              key={row.id}
              index={index}
              bucket={bucket}
              row={row}
              errors={errors}
              onChange={(change) => setBucket(index, change)}
              onRemove={(remove) => markRemoved(index, remove)}
            />
          );
        })}

        {values.added.map((row, index) => (
          <NewBucketPanel
            key={row.key}
            index={index}
            row={row}
            errors={errors}
            suggestions={suggestionsFor(row.key)}
            onChange={(change) => setAdded(row.key, change)}
            onDiscard={() => discard(row.key)}
          />
        ))}

        <div>
          <Button type="button" variant="secondary" onClick={addBucket}>
            Add bucket
          </Button>
        </div>

        <Field
          label="Note (optional)"
          value={values.note}
          onChange={(note) => setValues((current) => ({ ...current, note }))}
          className="max-w-xl"
        />

        <div className="flex flex-wrap gap-3">
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

const FIELDS_GRID =
  "grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] items-start gap-x-4 gap-y-3";

const PANEL_NAME =
  "line-clamp-2 min-w-0 text-title-card text-text-primary [overflow-wrap:anywhere]";

function SavedBucketPanel({
  index,
  bucket,
  row,
  errors,
  onChange,
  onRemove,
}: {
  index: number;
  bucket: BudgetBucketSummary;
  row: SavedRow;
  errors: FieldErrors;
  onChange: (change: Partial<SavedRow>) => void;
  onRemove: (remove: boolean) => void;
}) {
  const refusal = removalRefusal(bucket);
  const removeError = errors[`buckets.${index}.remove`];

  return (
    <CardShell className="p-5">
      <fieldset className="flex min-w-0 flex-col gap-4">
        {/* The saved name, kept while the Name field is being changed. */}
        {/* A rendered legend is not a flex item, so it takes its own margin. */}
        <legend className={cn(PANEL_NAME, "mb-1")} title={bucket.label}>
          {bucket.label}
        </legend>
        <p className="text-body-small text-text-secondary">
          {formatDollars(bucket.remaining)} remaining
        </p>

        {row.remove ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="min-w-0 text-body-default text-text-primary [overflow-wrap:anywhere]">
              {bucket.label} will be removed when you save.
            </p>
            <Button
              type="button"
              variant="secondary"
              name={`bucket-${index}-keep`}
              onClick={() => onRemove(false)}
            >
              Keep bucket
            </Button>
          </div>
        ) : (
          <>
            <div className={FIELDS_GRID}>
              <Field
                label="Name"
                value={row.name}
                onChange={(name) => onChange({ name })}
                error={errors[`buckets.${index}.name`]}
              />
              <ChipGroup
                legend="Change"
                options={CHANGE_OPTIONS}
                value={row.direction}
                onChange={(direction) => onChange({ direction: direction as FundDirection })}
              />
              <Field
                label="Amount"
                value={row.amount}
                onChange={(amount) => onChange({ amount })}
                error={errors[`buckets.${index}.amount`]}
              />
            </div>
            {refusal ? (
              <p className="text-body-small text-text-secondary">{refusal}</p>
            ) : (
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  name={`bucket-${index}-remove`}
                  onClick={() => onRemove(true)}
                >
                  Remove bucket
                </Button>
              </div>
            )}
          </>
        )}
        {removeError && <p className="text-body-small text-text-alert-strong">{removeError}</p>}
      </fieldset>
    </CardShell>
  );
}

function NewBucketPanel({
  index,
  row,
  errors,
  suggestions,
  onChange,
  onDiscard,
}: {
  index: number;
  row: AddedRow;
  errors: FieldErrors;
  suggestions: string[];
  onChange: (change: Partial<AddedRow>) => void;
  onDiscard: () => void;
}) {
  const suggestionsId = useId();

  return (
    <CardShell className="p-5">
      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className={cn(PANEL_NAME, "mb-4")}>New bucket</legend>
        <div className={FIELDS_GRID}>
          <Field
            label="Name"
            name={`added-${row.key}-name`}
            value={row.name}
            onChange={(name) => onChange({ name })}
            error={errors[`added.${index}.name`]}
          />
          <Field
            label="Starting amount"
            value={row.startingAmount}
            onChange={(startingAmount) => onChange({ startingAmount })}
            error={errors[`added.${index}.startingAmount`]}
          />
        </div>
        {suggestions.length > 0 && (
          <div
            role="group"
            aria-labelledby={suggestionsId}
            className="flex flex-wrap items-center gap-2"
          >
            <span id={suggestionsId} className="text-body-small text-text-secondary">
              Suggested names
            </span>
            {suggestions.map((name) => (
              <Button
                key={name}
                type="button"
                variant="secondary"
                onClick={() => onChange({ name })}
              >
                {name}
              </Button>
            ))}
          </div>
        )}
        <div>
          <Button type="button" variant="ghost" onClick={onDiscard}>
            Discard new bucket
          </Button>
        </div>
      </fieldset>
    </CardShell>
  );
}
