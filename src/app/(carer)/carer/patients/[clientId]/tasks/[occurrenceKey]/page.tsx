import { notFound } from "next/navigation";

import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { carerPatientBase } from "@/features/carer-patients/patient-routes";
import { resolveTaskDetailOrigin } from "@/features/family-task-detail/task-detail-origin";
import { TaskDetailView } from "@/features/family-task-detail/task-detail-view";
import { decodeOccurrenceKey } from "@/features/family-task-log/task-routes";
import { getEventDocuments } from "@/server/documents/queries";
import { getOccurrence, getToday } from "@/server/events/queries";

/**
 * Carer · Task detail (CAR-06 FD-02, CHG-048): the Family Task detail under the carer's own
 * path. 'Edit event' shows only while a shift with this patient is in progress (CAR-07). An unknown key, or one that belongs to
 * another client, is a 404.
 */
export default async function CarerTaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; occurrenceKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId, occurrenceKey } = await params;
  const patient = await findCarerPatient(clientId);
  const origin = await resolveTaskDetailOrigin(await searchParams, () => getToday());
  const occurrence = await getOccurrence(clientId, decodeOccurrenceKey(occurrenceKey), {
    type: "all",
  });

  if (!occurrence) notFound();

  const documents = await getEventDocuments(clientId, occurrence.eventId);

  return (
    <TaskDetailView
      clientId={clientId}
      occurrence={occurrence}
      documents={documents}
      origin={origin}
      basePath={carerPatientBase(clientId)}
      canEdit={patient.onShift}
    />
  );
}
