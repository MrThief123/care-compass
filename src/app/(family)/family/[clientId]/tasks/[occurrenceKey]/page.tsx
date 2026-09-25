import { notFound } from "next/navigation";

import { resolveTaskDetailOrigin } from "@/features/family-task-detail/task-detail-origin";
import { TaskDetailView } from "@/features/family-task-detail/task-detail-view";
import { decodeOccurrenceKey } from "@/features/family-task-log/task-routes";
import { getEventDocuments } from "@/server/documents/queries";
import { getOccurrence, getToday } from "@/server/events/queries";

/**
 * Family · Task detail (FAM-UI-07). Any task opens, past or future, by its key alone
 * (`getOccurrence`, not a scan of the log). An unknown key, or one that belongs to another
 * client, is a 404. The Documents card lists the event's documents (`getEventDocuments`). The
 * URL may carry where the task was opened from (CHG-014): `?from=calendar&view=&date=&month=`,
 * `?from=home`, or `?from=tasks&q=&status=&page=` (also the default, with or without `from`).
 * It is cleaned by `resolveTaskDetailOrigin` before the Back link is built from it, so Back
 * returns to that view and nothing raw is echoed into a link.
 */
export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; occurrenceKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId, occurrenceKey } = await params;
  const origin = await resolveTaskDetailOrigin(await searchParams, () => getToday());
  const occurrence = await getOccurrence(clientId, decodeOccurrenceKey(occurrenceKey));

  if (!occurrence) notFound();

  const documents = await getEventDocuments(clientId, occurrence.eventId);

  return (
    <TaskDetailView
      clientId={clientId}
      occurrence={occurrence}
      documents={documents}
      origin={origin}
    />
  );
}
