import Link from "next/link";

import { StatusPill } from "@/components/shared/status-pill";
import { CardShell } from "@/components/ui/card-shell";
import { formatTimeOfDay } from "@/features/family-task-log/melbourne-time";
import { occurrenceNurse } from "@/features/family-task-log/occurrence-display";
import { statusPillClassName } from "@/features/family-task-log/status-pill-class";
import type { TaskLogParams } from "@/features/family-task-log/task-log-params";
import { editEventHref } from "@/features/family-task-log/task-routes";
import { formatLongDate } from "@/lib/format/date";
import type { EventDocument, Occurrence } from "@/types/domain";

import { BackToTaskLogLink } from "./back-to-task-log-link";
import { DocumentTile } from "./document-tile";

export interface TaskDetailViewProps {
  clientId: string;
  occurrence: Occurrence;
  /** Documents attached to the task's event; read-only here. */
  documents: EventDocument[];
  /** The Task log view (q / status / page) this task was opened from, so Back returns to it. */
  backParams?: Partial<TaskLogParams>;
}

const CARD = "flex flex-col gap-3";
const CARD_TITLE = "text-title-card text-text-primary";

/**
 * Family · Task detail (FAM-UI-07): Back link, title, date and assignee,
 * then the Status, Description and Documents cards. No hooks, so it renders
 * on the server.
 */
export function TaskDetailView({
  clientId,
  occurrence,
  documents,
  backParams,
}: TaskDetailViewProps) {
  const nurse = occurrenceNurse(occurrence);
  const completedAt = occurrence.status === "done" ? occurrence.completedAt : undefined;
  const pillText = occurrence.status === "done" ? `Done · ${nurse}` : undefined;

  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
      <div className="flex flex-col">
        <BackToTaskLogLink clientId={clientId} view={backParams} />
        <h1 className="mt-1 text-title-page text-text-primary [overflow-wrap:anywhere]">
          {occurrence.title}
        </h1>
        <p className="mt-0.5 text-body-small text-text-secondary [overflow-wrap:anywhere]">
          {`${formatLongDate(occurrence.start)} · Assigned to ${nurse}`}
        </p>
      </div>

      <CardShell role="region" aria-labelledby="task-status-heading" className={CARD}>
        <h2 id="task-status-heading" className={CARD_TITLE}>
          Status
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* The pill may shrink below its text; its label then ends in an ellipsis and the
              whole text stays in the DOM and in the title (FD-21). */}
          <span title={pillText} className="flex min-w-0 max-w-full">
            <StatusPill
              status={occurrence.status}
              actorName={nurse}
              className={statusPillClassName(occurrence.status)}
            />
          </span>
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
        <p className="whitespace-pre-line text-body-default text-text-primary [overflow-wrap:anywhere]">
          {occurrence.description}
        </p>
      </CardShell>

      <CardShell role="region" aria-labelledby="task-documents-heading" className={CARD}>
        <h2 id="task-documents-heading" className={CARD_TITLE}>
          Documents
        </h2>
        {documents.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(10rem,100%),12rem))] gap-3">
            {documents.map((document) => (
              <li key={document.id} className="min-w-0">
                <DocumentTile document={document} />
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
