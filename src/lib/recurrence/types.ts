/**
 * Domain types for the recurrence engine (F0-09).
 *
 * All datetime/date strings are *local* values in the Australia/Melbourne
 * timezone (PD-046 / OQ-32 proposed default) with no UTC offset:
 * - LocalDateTime: `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`
 * - LocalDate:     `YYYY-MM-DD`
 *
 * Converting these local values to actual UTC instants (for `timestamptz`
 * storage) is the responsibility of the caller (F0-11) — out of scope here.
 */

export type LocalDateTime = string;
export type LocalDate = string;

export type Frequency = "none" | "daily" | "weekly" | "monthly" | "yearly";

/**
 * A recurrence rule. `interval` is the step size in units of `frequency`
 * (e.g. frequency "weekly" + interval 2 = fortnightly; frequency "monthly"
 * + interval 3 = quarterly — see PD-046 for how the full UI option set
 * maps onto this pair). Ignored (but still validated as >= 1) when
 * frequency is "none".
 */
export interface RecurrenceRule {
  frequency: Frequency;
  interval: number;
  anchor: LocalDateTime;
  until?: LocalDate;
}

export interface DateRange {
  /** Inclusive local start of the window. */
  start: LocalDateTime;
  /** Exclusive local end of the window. */
  end: LocalDateTime;
}

export interface CancelledOverride {
  type: "cancelled";
  /** Identity of the un-overridden occurrence this cancels. */
  originalStart: LocalDateTime;
}

export interface ModifiedOverride {
  type: "modified";
  /** Identity of the un-overridden occurrence this modifies. */
  originalStart: LocalDateTime;
  /** New effective start. */
  start: LocalDateTime;
  /** New effective duration, when the override changes it. */
  durationMinutes?: number;
}

export type RecurrenceOverride = CancelledOverride | ModifiedOverride;

export interface Occurrence {
  /** Stable identity: the un-overridden occurrence's local start. */
  originalStart: LocalDateTime;
  /** Effective local start, after any override is applied. */
  start: LocalDateTime;
  /** Effective duration, when known. */
  durationMinutes?: number;
}
