/**
 * Edit-shift validation (ADM-09), shared by the Manage screen and the `updateShift` / `cancelShift`
 * Server Actions. The date is never sent: it is the stored shift's own date (FD-02). The time rules
 * are Assign's (`shiftTimeRangeSchema`), so both give the same messages.
 */
import { z } from "zod";

import { END_BEFORE_START } from "./assign-shift-schema";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time as HH:MM.");

export const updateShiftSchema = z
  .object({
    shiftId: z.string().trim().min(1, "Choose a shift."),
    carerId: z.string().trim().min(1, "Choose a staff member."),
    start: time,
    end: time,
  })
  .refine(({ start, end }) => end > start, { message: END_BEFORE_START, path: ["end"] });

export const cancelShiftSchema = z.string().trim().min(1, "Choose a shift.");

export type UpdateShiftValues = z.infer<typeof updateShiftSchema>;
