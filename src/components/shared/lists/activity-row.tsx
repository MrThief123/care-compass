import { cn } from "@/lib/utils";
import type { OccurrenceStatus } from "@/types/domain";

import { Icon } from "../../ui/icon";
import { StatusPill } from "../status-pill";

export interface ActivityRowProps {
  title: string;
  /** Short date, e.g. "Sat 28 Nov". */
  date: string;
  status: OccurrenceStatus;
  actorName?: string;
  onClick?: () => void;
  className?: string;
}

/** Title, short date, status pill and chevron — Overdue card, Recent activity, Log panel (UI-03 PRD.md Scope). */
export function ActivityRow({
  title,
  date,
  status,
  actorName,
  onClick,
  className,
}: ActivityRowProps) {
  const content = (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-body-default text-text-primary">{title}</p>
        <p className="text-body-secondary text-text-secondary">{date}</p>
      </div>
      <StatusPill status={status} actorName={actorName} className="shrink-0" />
      {onClick && (
        <Icon name="chevron-right" size={16} className="shrink-0 text-text-secondary" aria-hidden />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 border-b border-border-subtle py-2 text-left",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 border-b border-border-subtle py-2", className)}>
      {content}
    </div>
  );
}
