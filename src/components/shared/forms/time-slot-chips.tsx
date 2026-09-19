"use client";

import { cn } from "@/lib/utils";

import { ChipGroup } from "./chip-group";
import { Field } from "./field";
import { customTimeRangeSchema, fieldErrors } from "./validation";

export const TIME_SLOTS = ["07:00-11:00", "11:00-15:00", "15:00-19:00"] as const;
export const CUSTOM_SLOT = "custom";

export interface TimeSlotValue {
  /** One of `TIME_SLOTS`, or `CUSTOM_SLOT`. */
  slot: string;
  customStart?: string;
  customEnd?: string;
}

export interface TimeSlotChipsProps {
  value: TimeSlotValue;
  onChange: (value: TimeSlotValue) => void;
  legend?: string;
  className?: string;
}

/** "07:00-11:00" -> "07:00 – 11:00" (en dash, as the design shows). */
function slotLabel(slot: string): string {
  return slot.replace("-", " – ");
}

/**
 * The end-time error for a custom range, or undefined while the range is still
 * incomplete — an unfinished field is not yet wrong.
 */
export function customRangeError(value: TimeSlotValue): string | undefined {
  if (value.slot !== CUSTOM_SLOT) return undefined;
  if (!value.customStart || !value.customEnd) return undefined;

  const result = fieldErrors(customTimeRangeSchema, {
    start: value.customStart,
    end: value.customEnd,
  });
  return result.ok ? undefined : result.errors.end;
}

/**
 * Time-slot chips with a Custom option that reveals two time inputs
 * (UI-02 Scope: `ChipGroup` … time slots … Custom revealing two time inputs).
 */
export function TimeSlotChips({
  value,
  onChange,
  legend = "Time slot",
  className,
}: TimeSlotChipsProps) {
  const isCustom = value.slot === CUSTOM_SLOT;
  const endError = customRangeError(value);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ChipGroup
        legend={legend}
        value={value.slot}
        onChange={(slot) =>
          // Leaving Custom drops the half-typed range so it cannot be submitted later.
          onChange(slot === CUSTOM_SLOT ? { ...value, slot } : { slot })
        }
        options={[
          ...TIME_SLOTS.map((slot) => ({ value: slot, label: slotLabel(slot) })),
          { value: CUSTOM_SLOT, label: "Custom" },
        ]}
      />

      {isCustom && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Start time"
            value={value.customStart ?? ""}
            onChange={(customStart) => onChange({ ...value, customStart })}
          />
          <Field
            label="End time"
            value={value.customEnd ?? ""}
            onChange={(customEnd) => onChange({ ...value, customEnd })}
            error={endError}
          />
        </div>
      )}
    </div>
  );
}
