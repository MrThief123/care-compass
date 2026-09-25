import { notFound } from "next/navigation";

import { costValuesFromEvent } from "@/features/family-event-form/event-cost";
import { editEventReturnHref } from "@/features/family-event-form/event-form-return";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { editEventValues, isTaskEvent } from "@/features/family-event-form/event-form-values";
import { resolveTaskDetailOrigin } from "@/features/family-task-detail/task-detail-origin";
import { getBudgetSummary } from "@/server/budget/queries";
import { getEventDocuments } from "@/server/documents/queries";
import { getEvent, getOccurrence, getToday, getTodayOccurrences } from "@/server/events/queries";

/**
 * Family · Edit event (FAM-UI-03). The event comes from `getEvent` (CHG-008);
 * an unknown id, or another client's, is a 404. The occurrence being edited is
 * `?occurrence=<key>` (the route FAM-07 wires). Without one, or with a key of
 * another event, it is today's occurrence of the event, else the event's
 * anchor date (FD-01). Cost and Paid from open with the event's saved cost and the client's
 * buckets (FAM-UI-08).
 *
 * Save event and Cancel go to that occurrence's Task detail with the Task detail origin the
 * link carried (`from=` plus that screen's params, CHG-014), or to the origin screen when the
 * occurrence is missing or not this event's (CHG-015). Both are re-validated here first.
 */
export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId, eventId } = await params;
  const raw = await searchParams;
  const { occurrence: occurrenceParam } = raw;

  const event = await getEvent(clientId, eventId);
  if (!event) notFound();

  const requested =
    typeof occurrenceParam === "string"
      ? await getOccurrence(clientId, occurrenceParam)
      : undefined;
  const viewed = requested?.eventId === event.id ? requested : undefined;
  const occurrence =
    viewed ?? (await getTodayOccurrences(clientId)).find((today) => today.eventId === event.id);
  const origin = await resolveTaskDetailOrigin(raw, () => getToday());

  const [documents, buckets] = await Promise.all([
    getEventDocuments(clientId, event.id),
    getBudgetSummary(clientId),
  ]);
  const values = editEventValues(event, occurrence);

  return (
    <EventFormScreen
      mode="edit"
      initialValues={values}
      initialIsTask={isTaskEvent(event)}
      month={values.date}
      documents={documents}
      buckets={buckets}
      initialCost={costValuesFromEvent(event)}
      returnHref={editEventReturnHref(clientId, viewed?.key, origin)}
    />
  );
}
