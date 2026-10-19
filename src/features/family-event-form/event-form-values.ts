import type { EventFormValues } from "@/components/shared/forms";
import { melbourneDateKey } from "@/features/family-task-log/melbourne-time";
import { isPlainEvent, type AnyOccurrence, type CareEvent } from "@/types/domain";

/** Add event opens empty: no date, 'Does not repeat', Planned (FD-02). */
export const EMPTY_EVENT_VALUES: EventFormValues = {
  date: "",
  recurrence: "none",
  status: "planned",
  description: "",
};

/**
 * Edit event values: the series fields from the event, and the date and
 * status from the occurrence being edited. With no occurrence, the event's
 * anchor date as Planned (FD-01). A plain event has no status, so it shows Planned too.
 */
export function editEventValues(event: CareEvent, occurrence?: AnyOccurrence): EventFormValues {
  return {
    date: melbourneDateKey(occurrence?.start ?? event.start),
    recurrence: event.recurrenceFrequency,
    status: occurrence && !isPlainEvent(occurrence) ? occurrence.status : "planned",
    description: event.description,
  };
}

/**
 * The task switch (CHG-009): `manual` is a task, `automatic` a plain event.
 * A new event starts as a task.
 */
export function isTaskEvent(event?: CareEvent): boolean {
  return (event?.completionMode ?? "manual") === "manual";
}
