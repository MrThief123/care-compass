import Link from "next/link";

import { StatusPill } from "@/components/shared/status-pill";
import { CardShell } from "@/components/ui/card-shell";
import { formatDollars } from "@/features/family-event-form/event-cost";
import { editEventDetailsValues } from "@/features/family-event-form/event-details";
import { editEventHrefFrom } from "@/features/family-event-form/event-form-return";
import { OpenDocumentTile } from "@/features/family-event-form/open-document-tile";
import { lateCompletionNote } from "@/features/family-task-log/late-completion";
import { formatTimeOfDay } from "@/features/family-task-log/melbourne-time";
import { occurrenceNurse } from "@/features/family-task-log/occurrence-display";
import { statusPillClassName } from "@/features/family-task-log/status-pill-class";
import { formatLongDate } from "@/lib/format/date";
import {
  isPlainEvent,
  type AnyOccurrence,
  type CareEvent,
  type EventDocument,
  type RecurrenceFrequency,
} from "@/types/domain";

import { BackLink } from "./back-link";
import { DeleteEventButton } from "./delete-event-button";
import { backLinkFor } from "./task-detail-origin";

import type { TaskDetailOrigin } from "./task-detail-origin";

export interface TaskDetailViewProps {
  clientId: string;
  occurrence: AnyOccurrence;
  /** Documents attached to the task's event; read-only here. */
  documents: EventDocument[];
  /**
   * Where this task was opened from (Calendar, Home or Task log, with that screen's validated
   * view), so Back returns to it (CHG-014). Absent: 'Back to Task log'.
   */
  origin?: TaskDetailOrigin;
  /** Where the links go; defaults to `/family/<id>` (a carer sets it, CHG-043). */
  basePath?: string;
  /** False: no Edit event link (a carer with no shift in progress, CHG-048). */
  canEdit?: boolean;
  /**
   * FAM-18: show 'Delete event' (a Family or on-shift Carer page sets it; Admin never does, and
   * it is off by default). `recurring` makes the dialog offer 'This and all future occurrences'.
   */
  canDelete?: boolean;
  recurring?: boolean;
  /** The event itself: adds the Details card (repeat, times, tick-off, cost). Absent: no card. */
  event?: CareEvent;
  /** Name of the bucket that pays the event's cost. */
  bucketName?: string;
}

const RECURRENCE_LABELS: Record<RecurrenceFrequency, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  every2months: "Every 2 months",
  quarterly: "Quarterly",
  every6months: "Every 6 months",
  yearly: "Yearly",
};

const CARD = "flex flex-col gap-3";
const CARD_TITLE = "text-title-card text-text-primary";

/**
 * 'Edit event' is a link (it navigates) styled as the kit's outlined `secondary` Button, as the
 * Calendar's 'Today' is: brand border, dark text on a transparent fill, 44px tall and at least
 * 44px wide (the kit `Button` renders a `<button>` and cannot wrap a link, FD-27).
 */
const EDIT_EVENT_BUTTON =
  "inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control border border-border-brand bg-transparent px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors outline-none hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * Family · Task detail (FAM-UI-07): Back link, title with the 'Edit event' button, date and
 * assignee, then the Status, Description and Documents cards. Read-only: editing happens on the
 * Edit event page (CHG-014). No hooks, so it renders on the server.
 */
export function TaskDetailView({
  clientId,
  occurrence,
  documents,
  origin,
  basePath,
  canEdit = true,
  canDelete = false,
  recurring = false,
  event,
  bucketName,
}: TaskDetailViewProps) {
  const plain = isPlainEvent(occurrence);
  const details = event
    ? editEventDetailsValues(
        event,
        plain ? { ...occurrence, kind: "task", status: "planned" } : occurrence,
      )
    : undefined;
  const detailRows: [string, string][] = event
    ? [
        ["Repeats", RECURRENCE_LABELS[event.recurrenceFrequency]],
        ["Start time", details!.startTime],
        ["End time", details!.endTime || "No end time"],
        [
          "Tick-off",
          event.completionMode === "automatic" ? "Not needed" : "A task: must be ticked off",
        ],
        ["Cost", event.cost === undefined ? "No cost" : formatDollars(event.cost)],
        ...(event.cost !== undefined
          ? ([["Paid from", bucketName ?? "Removed bucket"]] as [string, string][])
          : []),
      ]
    : [];
  const nurse = occurrenceNurse(plain ? { assignee: occurrence.assignee } : occurrence);
  const completedAt = !plain && occurrence.status === "done" ? occurrence.completedAt : undefined;
  const lateNote = !plain ? lateCompletionNote(occurrence) : undefined;
  const pillText = !plain && occurrence.status === "done" ? `Done · ${nurse}` : undefined;

  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
      <div className="flex flex-col">
        <BackLink clientId={clientId} origin={origin} basePath={basePath} />
        {/* The button sits right of the title and wraps below it when the row is too narrow;
            the title and date line take the rest of the row and wrap anywhere, so they never overlap. */}
        <div
          data-testid="task-detail-title-row"
          className="mt-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-2"
        >
          <div className="flex min-w-0 flex-[1_1_16rem] flex-col">
            <h1 className="min-w-0 text-title-page text-text-primary [overflow-wrap:anywhere]">
              {occurrence.title}
            </h1>
            <p className="mt-0.5 text-body-small text-text-secondary [overflow-wrap:anywhere]">
              {`${formatLongDate(occurrence.start)} · Assigned to ${nurse}`}
            </p>
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={editEventHrefFrom(clientId, occurrence, origin, basePath)}
                className={EDIT_EVENT_BUTTON}
              >
                Edit event
              </Link>
              {/* FAM-18: completed care stays in the record, so a Done occurrence has no delete. */}
              {canDelete && (plain || occurrence.status !== "done") && (
                <DeleteEventButton
                  clientId={clientId}
                  eventId={occurrence.eventId}
                  occurrenceKey={occurrence.key}
                  recurring={recurring}
                  returnHref={backLinkFor(clientId, origin, basePath).href}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <CardShell role="region" aria-labelledby="task-status-heading" className={CARD}>
        <h2 id="task-status-heading" className={CARD_TITLE}>
          Status
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* The pill may shrink below its text; its label then ends in an ellipsis and the
              whole text stays in the DOM and in the title (FD-21). */}
          {plain ? (
            <p className="text-body-default text-text-primary">Event · No tick-off needed</p>
          ) : (
            <span title={pillText} className="flex min-w-0 max-w-full">
              <StatusPill
                status={occurrence.status}
                actorName={nurse}
                className={statusPillClassName(occurrence.status)}
              />
            </span>
          )}
          {completedAt && (
            <p className="text-body-small text-text-secondary">
              {`Completed at ${formatTimeOfDay(completedAt)}`}
            </p>
          )}
          {lateNote && <p className="text-body-small text-text-secondary">{lateNote}</p>}
        </div>
      </CardShell>

      {event && (
        <CardShell role="region" aria-labelledby="task-details-heading" className={CARD}>
          <h2 id="task-details-heading" className={CARD_TITLE}>
            Details
          </h2>
          <dl className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-body-default">
            {detailRows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-text-secondary">{label}</dt>
                <dd className="text-text-primary [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
        </CardShell>
      )}

      <CardShell role="region" aria-labelledby="task-description-heading" className={CARD}>
        <h2 id="task-description-heading" className={CARD_TITLE}>
          Description
        </h2>
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
                <OpenDocumentTile document={document} />
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
