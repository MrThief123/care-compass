import Link from "next/link";

import { StatusPill } from "@/components/shared/status-pill";
import { Icon } from "@/components/ui/icon";
import type { OccurrenceStatus } from "@/types/domain";

export interface ActivityLinkRowProps {
  href: string;
  title: string;
  /** Short date, e.g. "Sat 28 Nov". */
  date: string;
  status: OccurrenceStatus;
  /** Who did it; a Done pill always names them (REQ-19). */
  actorName?: string;
}

/** The pill's own text: also its hover title, so a name cut short can still be read whole. */
function pillText(status: OccurrenceStatus, actorName?: string): string {
  if (status === "done") return `Done · ${actorName ?? "—"}`;
  return status === "overdue" ? "Overdue" : "Planned";
}

/**
 * A row of the Overdue and Recent activity cards: title, short date, status
 * pill and chevron, the whole row one link to that occurrence's task detail.
 *
 * Local rather than the kit's `ActivityRow`, which is a `<button>` that calls
 * `router.push` (no open-in-new-tab, no link semantics), lets a long carer name
 * squeeze the title to nothing, and cuts a long title to one line. Here the
 * title wraps to two lines and then ends in an ellipsis, the pill is never
 * squeezed and its own text ends in an ellipsis instead, and the full title and
 * name are on hover and in the link's accessible name (DECISIONS.md FD-15).
 */
export function ActivityLinkRow({ href, title, date, status, actorName }: ActivityLinkRowProps) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 border-b border-border-subtle py-2 text-left outline-none hover:bg-bg-brand-pale/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <p title={title} className="line-clamp-2 text-body-default break-words text-text-primary">
          {title}
        </p>
        <p className="text-body-secondary text-text-secondary">{date}</p>
      </div>
      <span title={pillText(status, actorName)} className="flex max-w-[55%] min-w-0 shrink-0">
        <StatusPill status={status} actorName={actorName} className="min-w-0" />
      </span>
      <Icon name="chevron-right" size={16} className="shrink-0 text-text-secondary" aria-hidden />
    </Link>
  );
}
