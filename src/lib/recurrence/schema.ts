import { z } from "zod";

/** `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`, no UTC offset. */
const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
/** `YYYY-MM-DD`. */
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const localDateTimeSchema = z
  .string()
  .regex(LOCAL_DATE_TIME_PATTERN, "must be a local datetime (YYYY-MM-DDTHH:mm[:ss], no offset)");

export const localDateSchema = z
  .string()
  .regex(LOCAL_DATE_PATTERN, "must be a local date (YYYY-MM-DD)");

export const frequencySchema = z.enum(["none", "daily", "weekly", "monthly", "yearly"]);

export const recurrenceRuleSchema = z.object({
  frequency: frequencySchema,
  interval: z
    .number()
    .int("interval must be a whole number")
    .positive("interval must be at least 1"),
  anchor: localDateTimeSchema,
  until: localDateSchema.optional(),
});

export const cancelledOverrideSchema = z.object({
  type: z.literal("cancelled"),
  originalStart: localDateTimeSchema,
});

export const modifiedOverrideSchema = z.object({
  type: z.literal("modified"),
  originalStart: localDateTimeSchema,
  start: localDateTimeSchema,
  durationMinutes: z.number().int().positive().optional(),
});

export const recurrenceOverrideSchema = z.discriminatedUnion("type", [
  cancelledOverrideSchema,
  modifiedOverrideSchema,
]);

export const dateRangeSchema = z.object({
  start: localDateTimeSchema,
  end: localDateTimeSchema,
});
