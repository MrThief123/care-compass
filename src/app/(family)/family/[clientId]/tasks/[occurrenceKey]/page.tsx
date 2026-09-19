import { notFound } from "next/navigation";

import { findOccurrence } from "@/features/family-task-detail/find-occurrence";
import { TaskDetailView } from "@/features/family-task-detail/task-detail-view";
import { decodeOccurrenceKey } from "@/features/family-task-log/task-routes";

/**
 * Family · Task detail (FAM-UI-07). An unknown key, or one that belongs to
 * another client, is a 404. Documents are not readable through any contract
 * function yet, so the card shows its empty state (DECISIONS.md FD-04).
 */
export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; occurrenceKey: string }>;
}) {
  const { clientId, occurrenceKey } = await params;
  const occurrence = await findOccurrence(clientId, decodeOccurrenceKey(occurrenceKey));

  if (!occurrence) notFound();

  return <TaskDetailView clientId={clientId} occurrence={occurrence} documents={[]} />;
}
