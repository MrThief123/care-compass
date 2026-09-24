"use client";

import { useState } from "react";
import { z } from "zod";

import type { LocalDate } from "@/lib/dates/week-range";
import { formatLongDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { OccurrenceStatus, RecurrenceFrequency } from "@/types/domain";

import { Button } from "../../ui/button";
import { CardShell } from "../../ui/card-shell";
import { Icon } from "../../ui/icon";
import { DatePickerGrid } from "../calendar/date-picker-grid";

import { ChipGroup } from "./chip-group";
import { Field } from "./field";
import { fieldErrors, requiredText } from "./validation";

import type { ReactNode } from "react";

/** Full frequency set per PD-046; order matches the decision text. */
const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "every2months", label: "Every 2 months" },
  { value: "quarterly", label: "Quarterly" },
  { value: "every6months", label: "Every 6 months" },
  { value: "yearly", label: "Yearly" },
];

/**
 * Overdue is shown so the current state is legible, but it is derived when the
 * due time passes without a completion, never chosen by hand (PD-044).
 */
const STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
  { value: "overdue", label: "Overdue", disabled: true },
];

export interface EventFormValues {
  /** `YYYY-MM-DD`; empty until a date is picked. */
  date: LocalDate;
  recurrence: RecurrenceFrequency;
  status: OccurrenceStatus;
  description: string;
}

/** What a plain event submits (UI-05, CHG-009): a plain event has no status. */
export type PlainEventFormValues = Omit<EventFormValues, "status">;

const eventFormSchema = z.object({
  date: requiredText("Date"),
  recurrence: z.string(),
  status: z.string(),
  description: z.string(),
});

interface EventFormBaseProps {
  values: EventFormValues;
  onChange: (values: EventFormValues) => void;
  onCancel: () => void;
  /** Any date in the month the picker opens on. */
  month: LocalDate;
  onMonthChange?: (month: LocalDate) => void;
  datesWithItems?: LocalDate[];
  /** Documents slot — filled by F0-13 / FAM-08; uploads are out of scope here. */
  documents?: ReactNode;
  /**
   * Extra fields above Description. PD-047 (Title, Start time, Duration) and
   * PD-044 (completion-mode toggle) are implemented by FAM-06 / FAM-07 / CAR-07
   * and passed in here, so the layout is not rebuilt per dashboard.
   */
  extraFields?: ReactNode;
  submitLabel?: string;
  className?: string;
}

interface TaskEventFormProps extends EventFormBaseProps {
  hideStatus?: false;
  onSubmit: (values: EventFormValues) => void;
}

interface PlainEventFormProps extends EventFormBaseProps {
  /**
   * A plain event (UI-05, CHG-009): the Status chips are not rendered and
   * `onSubmit` receives the values without `status`. Driven by the shared
   * `Switch` on the Add / Edit event screens.
   */
  hideStatus: true;
  onSubmit: (values: PlainEventFormValues) => void;
}

/**
 * With `hideStatus` left out the form is unchanged. A caller that toggles
 * `hideStatus` passes an `onSubmit` taking `PlainEventFormValues`, which
 * serves both cases.
 */
export type EventFormProps = TaskEventFormProps | PlainEventFormProps;

function shiftMonth(month: LocalDate, step: number): LocalDate {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year!, monthIndex! - 1 + step, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * The Edit event layout (UI-02 Scope: `EventForm`): fields on the left,
 * "Pick a date" card with Save event and Cancel on the right.
 */
export function EventForm(props: EventFormProps) {
  const {
    values,
    onChange,
    onCancel,
    month,
    onMonthChange,
    datesWithItems,
    documents,
    extraFields,
    submitLabel = "Save event",
    className,
  } = props;
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Uncontrolled month, so callers that do not care about paging still get it.
  const [ownMonth, setOwnMonth] = useState(month);
  const shownMonth = onMonthChange ? month : ownMonth;

  function changeMonth(step: number) {
    const next = shiftMonth(shownMonth, step);
    if (onMonthChange) onMonthChange(next);
    else setOwnMonth(next);
  }

  function handleSubmit() {
    const result = fieldErrors(eventFormSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    if (props.hideStatus) {
      // Field by field, so a new form field fails the type check here.
      const { date, recurrence, description } = values;
      props.onSubmit({ date, recurrence, description });
    } else {
      props.onSubmit(values);
    }
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]", className)}>
      <div className="flex flex-col gap-4">
        <Field
          label="Date"
          value={values.date ? formatLongDate(values.date) : ""}
          onChange={() => {}}
          readOnly
          error={errors.date}
          adornment={<Icon name="calendar" size={20} aria-hidden />}
        />

        <Field
          label="Recurring"
          type="select"
          value={values.recurrence}
          onChange={(recurrence) =>
            onChange({ ...values, recurrence: recurrence as RecurrenceFrequency })
          }
          options={RECURRENCE_OPTIONS}
        />

        {/* Absent, not disabled: a plain event has no status (UI-05). */}
        {!props.hideStatus && (
          <ChipGroup
            legend="Status"
            value={values.status}
            onChange={(status) => onChange({ ...values, status: status as OccurrenceStatus })}
            options={STATUS_OPTIONS}
          />
        )}

        {extraFields}

        <Field
          label="Description"
          type="textarea"
          value={values.description}
          onChange={(description) => onChange({ ...values, description })}
        />

        {documents && (
          <section className="flex flex-col gap-2">
            <h3 className="text-body-emphasis text-text-primary">Documents</h3>
            {documents}
          </section>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <CardShell className="flex flex-col gap-3 p-4">
          <h3 className="text-title-card text-text-primary">Pick a date</h3>
          <DatePickerGrid
            month={shownMonth}
            selected={values.date || undefined}
            datesWithItems={datesWithItems}
            onSelect={(date) => onChange({ ...values, date })}
            onPrevMonth={() => changeMonth(-1)}
            onNextMonth={() => changeMonth(1)}
          />
        </CardShell>

        <Button onClick={handleSubmit}>{submitLabel}</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
