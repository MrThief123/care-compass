/**
 * Zod-based client validation shared with future server actions (UI-02 Scope).
 *
 * Screens hold their own values; this module only turns a schema plus a value
 * into the per-field error strings the `Field` wrapper renders. Keeping the
 * schemas here means the same object can be reused by a server action later
 * without a second validation pattern (CLAUDE.md §7).
 */
import { z } from "zod";

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

/**
 * Validates `values` and maps each issue onto its field name. Where a field has
 * more than one issue only the first is kept — forms show one message per field.
 */
export function fieldErrors<T>(schema: z.ZodType<T>, values: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(values);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.map(String).join(".");
    if (key && errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return { ok: false, errors };
}

/** A trimmed, non-empty string, with the "<Label> is required." message forms use. */
export function requiredText(label: string) {
  return z.string().trim().min(1, `${label} is required.`);
}

/** "HH:MM" on a 24-hour clock. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const timeSchema = z.string().regex(TIME_PATTERN, "Enter a time as HH:MM.");

export const END_BEFORE_START = "End time must be after the start time.";

/**
 * The Custom time slot's two inputs (UI-02 Error / Edge Cases: "Custom slot with
 * end before start → inline error"). The cross-field message is reported on
 * `end`, which is the field the user has to change.
 */
export const customTimeRangeSchema = z
  .object({ start: timeSchema, end: timeSchema })
  .refine((range) => range.end > range.start, {
    message: END_BEFORE_START,
    path: ["end"],
  });

export type CustomTimeRange = z.infer<typeof customTimeRangeSchema>;
