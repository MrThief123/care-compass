import { notFound, redirect } from "next/navigation";

import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { carerPatientBase } from "@/features/carer-patients/patient-routes";
import { costValuesFromEvent } from "@/features/family-event-form/event-cost";
import { editEventDetailsValues } from "@/features/family-event-form/event-details";
import { editEventReturnHref } from "@/features/family-event-form/event-form-return";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { editEventValues, isTaskEvent } from "@/features/family-event-form/event-form-values";
import { resolveTaskDetailOrigin } from "@/features/family-task-detail/task-detail-origin";
import { getBudgetSummary } from "@/server/budget/queries";
import { getEventDocuments } from "@/server/documents/queries";
import { parseOccurrenceKey } from "@/server/events/occurrence-key";
import { getEvent, getOccurrence, getToday, getTodayOccurrences } from "@/server/events/queries";

/**
 * Carer · Edit event (CAR-07, CHG-048): the Family edit form under the carer's own path. Only
 * while a shift with this patient is in progress; otherwise the carer goes to the patient's
 * Calendar before any event or budget data is read. An unknown id, or another client's, is a
 * 404. Save and Cancel return to that occurrence's carer Task detail.
 */
export default async function CarerEditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId, eventId } = await params;
  const patient = await findCarerPatient(clientId);
  const base = carerPatientBase(clientId);
  if (!patient.onShift) redirect(`${base}/calendar`);

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
  // The occurrence's identity (PD-004), never its possibly-overridden displayed start.
  const occurrenceOriginalStart = occurrence
    ? (parseOccurrenceKey(occurrence.key)?.originalStart ?? event.start)
    : event.start;

  return (
    <EventFormScreen
      mode="edit"
      clientId={clientId}
      eventId={event.id}
      occurrenceOriginalStart={occurrenceOriginalStart}
      initialValues={values}
      initialIsTask={isTaskEvent(event)}
      initialDetails={editEventDetailsValues(event, occurrence)}
      month={values.date}
      documents={documents}
      buckets={buckets}
      initialCost={costValuesFromEvent(event)}
      returnHref={editEventReturnHref(clientId, viewed?.key, origin, base)}
      notAllowedMessage={`Your shift with ${patient.firstName} has ended, so this event wasn't saved.`}
    />
  );
}
