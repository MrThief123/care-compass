import { z } from "zod";

import { fieldErrors } from "@/components/shared/forms";
import { instantToMelbourneLocal } from "@/lib/dates/melbourne-time";
import type { CareEvent, Occurrence } from "@/types/domain";

/**
 * Title, Start time and End time (OQ-22/PD-047; End time replaces Duration, CHG-051): first-class
 * event fields the design lacked. Held as typed text, like `EventCostValues`, so nothing is
 * reformatted under the person's cursor. The stored value stays `durationMinutes` (end - start).
 */
export interface EventDetailsValues {
  title: string;
  /** `HH:mm`, 24-hour. */
  startTime: string;
  /** `HH:mm`, 24-hour, later than `startTime` on the same day; empty means no end (0 minutes). */
  endTime: string;
}

/** Add event opens empty; a reasonable default start time, no duration. */
export const EMPTY_EVENT_DETAILS: EventDetailsValues = {
  title: "",
  startTime: "09:00",
  endTime: "",
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const TITLE_MESSAGE = "Enter a title.";
const START_TIME_MESSAGE = "Enter a start time (HH:mm).";
const END_TIME_MESSAGE = "Enter an end time (HH:mm).";
const END_BEFORE_START_MESSAGE = "End time must be after the start time.";

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours! * 60 + minutes!;
}

/**
 * Title and Start time are required (AC-02's pattern extended to the fields this
 * feature adds); End time is optional (blank is 0 minutes) and, when given, must be later than
 * Start time (no overnight, FAM-16 AC-09). Messages are keyed `title`, `startTime`, `endTime`;
 * `{}` means valid.
 */
export function validateEventDetails(values: EventDetailsValues): Record<string, string> {
  const schema = z
    .object({ title: z.string(), startTime: z.string(), endTime: z.string() })
    .superRefine((input, context) => {
      if (input.title.trim() === "") {
        context.addIssue({ code: "custom", path: ["title"], message: TITLE_MESSAGE });
      }
      if (!TIME_PATTERN.test(input.startTime)) {
        context.addIssue({ code: "custom", path: ["startTime"], message: START_TIME_MESSAGE });
      }
      const end = input.endTime.trim();
      if (end !== "") {
        if (!TIME_PATTERN.test(end)) {
          context.addIssue({ code: "custom", path: ["endTime"], message: END_TIME_MESSAGE });
        } else if (
          TIME_PATTERN.test(input.startTime) &&
          minutesOf(end) <= minutesOf(input.startTime)
        ) {
          context.addIssue({
            code: "custom",
            path: ["endTime"],
            message: END_BEFORE_START_MESSAGE,
          });
        }
      }
    });
  const result = fieldErrors(schema, values);
  return result.ok ? {} : result.errors;
}

/**
 * Edit event's Title/Start time/End time (PD-047): the series title, and the viewed occurrence's
 * own start time and End time (start + its `durationMinutes`, which already reflect any
 * per-occurrence override, same as `editEventValues`'s `date`). A zero duration leaves End time
 * blank. With no occurrence, the event's own anchor. An event running past midnight shows the
 * next day's clock time, which the form then asks to be re-timed (FAM-16 FD-03).
 */
export function editEventDetailsValues(
  event: CareEvent,
  occurrence?: Occurrence,
): EventDetailsValues {
  const start = occurrence?.start ?? event.start;
  const durationMinutes = occurrence?.durationMinutes ?? event.durationMinutes;
  const startTime = instantToMelbourneLocal(start).slice(11, 16);
  return {
    title: event.title,
    startTime,
    endTime: durationMinutes > 0 ? clock(minutesOf(startTime) + durationMinutes) : "",
  };
}

function clock(totalMinutes: number): string {
  const wrapped = totalMinutes % 1440;
  const hours = Math.floor(wrapped / 60);
  return `${String(hours).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

/** What the form holds once valid: trimmed title, `HH:mm` start time, whole minutes. */
export function parseEventDetails(
  values: EventDetailsValues,
): { title: string; startTime: string; durationMinutes: number } | undefined {
  if (Object.keys(validateEventDetails(values)).length > 0) return undefined;
  const end = values.endTime.trim();
  return {
    title: values.title.trim(),
    startTime: values.startTime,
    durationMinutes: end === "" ? 0 : minutesOf(end) - minutesOf(values.startTime),
  };
}
