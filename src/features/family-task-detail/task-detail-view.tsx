import Link from "next/link";

import { StatusPill } from "@/components/shared/status-pill";
import { CardShell } from "@/components/ui/card-shell";
import { formatTimeOfDay } from "@/features/family-task-log/melbourne-time";
import { occurrenceNurse } from "@/features/family-task-log/occurrence-display";
import { editEventHref } from "@/features/family-task-log/task-routes";
import { formatLongDate } from "@/lib/format/date";
import type { DocumentRef, Occurrence } from "@/types/domain";

import { BackToTaskLogLink } from "./back-to-task-log-link";
import { DocumentTile } from "./document-tile";

export interface TaskDetailViewProps {
  clientId: string;
  occurrence: Occurrence;
  /** Documents attached to the task's event; read-only here. */
  documents: Pick<DocumentRef, "id" | "name">[];
}

const CARD = "flex flex-col gap-3";
const CARD_TITLE = "text-title-card text-text-primary";

/**
 * Family · Task detail (FAM-UI-07): Back link, title, date and assignee,
 * then the Status, Description and Documents cards. No hooks, so it renders
 * on the server.
 */
export function TaskDetailView({ clientId, occurrence, documents }: TaskDetailViewProps) {
  const nurse = occurrenceNurse(occurrence);
  const completedAt = occurrence.status === "done" ? occurrence.completedAt : undefined;

  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
      <div className="flex flex-col">
        <BackToTaskLogLink clientId={clientId} />
        <h1 className="mt-1 break-words text-title-page text-text-primary">{occurrence.title}</h1>
        <p className="mt-0.5 text-body-small text-text-secondary">
          {`${formatLongDate(occurrence.start)} · Assigned to ${nurse}`}
        </p>
      </div>

      <CardShell role="region" aria-labelledby="task-status-heading" className={CARD}>
        <h2 id="task-status-heading" className={CARD_TITLE}>
          Status
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={occurrence.status} actorName={nurse} />
          {completedAt && (
            <p className="text-body-small text-text-secondary">
              {`Completed at ${formatTimeOfDay(completedAt)}`}
            </p>
          )}
        </div>
      </CardShell>

      <CardShell role="region" aria-labelledby="task-description-heading" className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="task-description-heading" className={CARD_TITLE}>
            Description
          </h2>
          <Link
            href={editEventHref(clientId, occurrence.eventId)}
            className="inline-flex h-11 items-center justify-center rounded-control px-4 text-body-emphasis text-text-brand underline-offset-4 hover:underline"
          >
            Edit
          </Link>
        </div>
        <p className="whitespace-pre-line break-words text-body-default text-text-primary">
          {occurrence.description}
        </p>
      </CardShell>

      <CardShell role="region" aria-labelledby="task-documents-heading" className={CARD}>
        <h2 id="task-documents-heading" className={CARD_TITLE}>
          Documents
        </h2>
        {documents.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {documents.map((document) => (
              <li key={document.id}>
                <DocumentTile name={document.name} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-default text-text-secondary">No documents attached.</p>
        )}
      </CardShell>
    </div>
  );
}
