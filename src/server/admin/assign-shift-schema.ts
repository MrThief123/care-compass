/**
 * Assign-shift validation (ADM-07), shared by the Manage screen and the `assignShift` Server Action
 * so both give the same messages. Times are Melbourne wall-clock `HH:MM` on one day; the end must be
 * after the start (overnight shifts are not offered by the panel).
 */
import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time as HH:MM.");

export const END_BEFORE_START = "End time must be after start time.";

export const shiftTimeRangeSchema = z
  .object({ start: time, end: time })
  .refine(({ start, end }) => end > start, { message: END_BEFORE_START, path: ["end"] });

/** A real calendar day as `YYYY-MM-DD` (rejects 2026-02-30). */
const localDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Choose a date.");

export const assignShiftSchema = z
  .object({
    carerId: z.string().trim().min(1, "Choose a staff member."),
    clientId: z.string().trim().min(1, "Choose a client."),
    date: localDate,
    start: time,
    end: time,
  })
  .refine(({ start, end }) => end > start, { message: END_BEFORE_START, path: ["end"] });

export type AssignShiftValues = z.infer<typeof assignShiftSchema>;
