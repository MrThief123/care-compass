"use client";

import { Field } from "@/components/shared/forms";

import type { EventDetailsValues } from "./event-details";

export interface EventDetailsFieldsProps {
  values: EventDetailsValues;
  onChange: (values: EventDetailsValues) => void;
  /** Messages keyed `title`, `startTime`, `duration` (`validateEventDetails`). */
  errors?: { title?: string; startTime?: string; duration?: string };
}

/**
 * Title, Start time and Duration (OQ-22/PD-047): first-class event fields the
 * kit's `EventForm` does not have (it only has Date, Recurring, Status and
 * Description). Built here, not in the shared kit, like `EventCostFields`
 * (FAM-UI-08) — the same `extraFields` slot.
 */
export function EventDetailsFields({ values, onChange, errors }: EventDetailsFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Title"
        value={values.title}
        onChange={(title) => onChange({ ...values, title })}
        error={errors?.title}
        required
      />
      <Field
        label="Start time"
        value={values.startTime}
        onChange={(startTime) => onChange({ ...values, startTime })}
        hint="24-hour, e.g. 09:30."
        error={errors?.startTime}
        required
      />
      <Field
        label="Duration"
        value={values.duration}
        onChange={(duration) => onChange({ ...values, duration })}
        hint="In minutes. Leave empty for 0."
        error={errors?.duration}
      />
    </div>
  );
}
