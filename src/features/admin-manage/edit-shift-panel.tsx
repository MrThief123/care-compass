"use client";

import { useState } from "react";

import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { Button } from "@/components/ui/button";
import { shiftTimeRangeSchema } from "@/server/admin/assign-shift-schema";
import type { ManagePerson, ManageShift } from "@/server/admin/manage-queries";

import { TimeRangePicker } from "./time-range-picker";

export interface EditShiftValues {
  carerId: string;
  start: string;
  end: string;
}

/**
 * Edit panel for one shift (ADM-09 FD-01): carer and times, on the shift's own date, which is shown
 * but fixed (moving a shift to another day or client is cancel and assign again). Replaces the
 * Assign form while open. Built from tokens (PD-052), reusing Assign's time controls.
 *
 * `onSave` resolves with per-field messages when the server refused the times, nothing otherwise.
 */
export function EditShiftPanel({
  shift,
  carers,
  carerName,
  clientName,
  dateLabel,
  otherShifts,
  clients,
  saving,
  failure,
  onChange,
  onSave,
  onStop,
}: {
  shift: ManageShift;
  carers: ManagePerson[];
  carerName: string;
  clientName: string;
  dateLabel: string;
  /** Every shift on the page; the one being edited is excluded here. */
  otherShifts: ManageShift[];
  clients: ManagePerson[];
  saving: boolean;
  failure: string;
  /** Any change to the form clears the parent's failure message. */
  onChange: () => void;
  onSave: (values: EditShiftValues) => Promise<Record<string, string> | void>;
  onStop: () => void;
}) {
  const [carerId, setCarerId] = useState(shift.staffId);
  const [start, setStart] = useState(shift.start);
  const [end, setEnd] = useState(shift.end);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // The shift's own carer is always offered, even if no longer in the list, so the select never
  // shows a different person from the one the shift has.
  const options = carers.some((person) => person.id === shift.staffId)
    ? carers
    : [{ id: shift.staffId, name: carerName }, ...carers];
  const chosenName = options.find((person) => person.id === carerId)?.name ?? carerName;

  const validRange = shiftTimeRangeSchema.safeParse({ start, end });
  const overlaps = validRange.success
    ? otherShifts.filter(
        (other) =>
          other.id !== shift.id &&
          other.staffId === carerId &&
          other.date === shift.date &&
          start < other.end &&
          end > other.start,
      )
    : [];

  async function save() {
    if (saving) return;
    if (!validRange.success) {
      setErrors(
        Object.fromEntries(
          validRange.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    const refused = await onSave({ carerId, ...validRange.data });
    if (refused) setErrors(refused);
  }

  return (
    <section aria-label="Edit shift" className="flex min-w-0 flex-col gap-5">
      <div className="space-y-1 rounded-inset bg-bg-inset p-3">
        <p className="break-words text-body-emphasis text-text-primary">
          {clientName} on {dateLabel}
        </p>
        <p className="text-body-default text-text-secondary">
          The date can&apos;t be changed here. To move this shift to another day, cancel it and
          assign it again.
        </p>
      </div>
      <Field
        label="Carer"
        type="select"
        value={carerId}
        options={options.map((person) => ({ value: person.id, label: person.name }))}
        onChange={(next) => {
          setCarerId(next);
          setErrors({});
          onChange();
        }}
      />
      <TimeRangePicker
        start={start}
        end={end}
        error={errors.end ?? errors.start}
        onChange={(next) => {
          setStart(next.start);
          setEnd(next.end);
          setErrors({});
          onChange();
        }}
      />
      {overlaps.length > 0 && (
        <InlineAlert>
          {overlaps
            .map(
              (other) =>
                `${chosenName} already has a shift with ${other.clientName ?? clients.find((person) => person.id === other.clientId)?.name ?? "another client"} from ${other.start} - ${other.end} that overlaps this time.`,
            )
            .join(" ")}{" "}
          You can still save it.
        </InlineAlert>
      )}
      {failure && (
        <p role="alert" className="text-body-default text-text-alert-strong">
          {failure}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onStop}>
          Stop editing
        </Button>
        <Button onClick={() => void save()} disabled={saving}>
          Save changes
        </Button>
      </div>
    </section>
  );
}
