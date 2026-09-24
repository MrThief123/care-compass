import { notFound } from "next/navigation";

import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { editEventValues } from "@/features/family-event-form/event-form-values";
import { getEventDocuments } from "@/server/documents/queries";
import { getEvent, getOccurrence, getTodayOccurrences } from "@/server/events/queries";

/**
 * Family · Edit event (FAM-UI-03). The event comes from `getEvent` (CHG-008);
 * an unknown id, or another client's, is a 404. The occurrence being edited is
 * `?occurrence=<key>` (the route FAM-07 wires). Without one, or with a key of
 * another event, it is today's occurrence of the event, else the event's
 * anchor date (FD-01).
 */
export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId, eventId } = await params;
  const { occurrence: occurrenceParam } = await searchParams;

  const event = await getEvent(clientId, eventId);
  if (!event) notFound();

  const requested =
    typeof occurrenceParam === "string"
      ? await getOccurrence(clientId, occurrenceParam)
      : undefined;
  const occurrence =
    requested?.eventId === event.id
      ? requested
      : (await getTodayOccurrences(clientId)).find((today) => today.eventId === event.id);

  const documents = await getEventDocuments(clientId, event.id);
  const values = editEventValues(event, occurrence);

  return (
    <EventFormScreen mode="edit" initialValues={values} month={values.date} documents={documents} />
  );
}
