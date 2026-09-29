import { z } from "zod";

import { fieldErrors } from "@/components/shared/forms";
import { instantToMelbourneLocal } from "@/lib/dates/melbourne-time";
import type { CareEvent, Occurrence } from "@/types/domain";

/**
 * Title, Start time and Duration (OQ-22/PD-047): first-class event fields the
 * design lacked. Held as typed text, like `EventCostValues`, so nothing is
 * reformatted under the person's cursor.
 */
export interface EventDetailsValues {
  title: string;
  /** `HH:mm`, 24-hour. */
  startTime: string;
  /** Minutes, as typed text; empty means 0. */
  duration: string;
}

/** Add event opens empty; a reasonable default start time, no duration. */
export const EMPTY_EVENT_DETAILS: EventDetailsValues = {
  title: "",
  startTime: "09:00",
  duration: "",
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DURATION_PATTERN = /^\d+$/;

const TITLE_MESSAGE = "Enter a title.";
const START_TIME_MESSAGE = "Enter a start time (HH:mm).";
const DURATION_MESSAGE = "Duration must be a whole number of minutes.";

/**
 * Title and Start time are required (AC-02's pattern extended to the fields this
 * feature adds); Duration is optional, defaulting to 0 minutes when left blank.
 * Messages are keyed `title`, `startTime`, `duration`; `{}` means valid.
 */
export function validateEventDetails(values: EventDetailsValues): Record<string, string> {
  const schema = z
    .object({ title: z.string(), startTime: z.string(), duration: z.string() })
    .superRefine((input, context) => {
      if (input.title.trim() === "") {
        context.addIssue({ code: "custom", path: ["title"], message: TITLE_MESSAGE });
      }
      if (!TIME_PATTERN.test(input.startTime)) {
        context.addIssue({ code: "custom", path: ["startTime"], message: START_TIME_MESSAGE });
      }
      if (input.duration.trim() !== "" && !DURATION_PATTERN.test(input.duration.trim())) {
        context.addIssue({ code: "custom", path: ["duration"], message: DURATION_MESSAGE });
      }
    });
  const result = fieldErrors(schema, values);
  return result.ok ? {} : result.errors;
}

/**
 * Edit event's Title/Start time/Duration (PD-047): the series title, and the
 * viewed occurrence's own start time and duration (its `start`/`durationMinutes`
 * already reflect any per-occurrence override, same as `editEventValues`'s
 * `date`). With no occurrence, the event's own anchor.
 */
export function editEventDetailsValues(
  event: CareEvent,
  occurrence?: Occurrence,
): EventDetailsValues {
  const start = occurrence?.start ?? event.start;
  const durationMinutes = occurrence?.durationMinutes ?? event.durationMinutes;
  return {
    title: event.title,
    startTime: instantToMelbourneLocal(start).slice(11, 16),
    duration: String(durationMinutes),
  };
}

/** What the form holds once valid: trimmed title, `HH:mm` start time, whole minutes. */
export function parseEventDetails(
  values: EventDetailsValues,
): { title: string; startTime: string; durationMinutes: number } | undefined {
  if (Object.keys(validateEventDetails(values)).length > 0) return undefined;
  const duration = values.duration.trim();
  return {
    title: values.title.trim(),
    startTime: values.startTime,
    durationMinutes: duration === "" ? 0 : Number(duration),
  };
}
