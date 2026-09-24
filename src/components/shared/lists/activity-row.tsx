import { cn } from "@/lib/utils";
import type { OccurrenceStatus } from "@/types/domain";

import { Icon } from "../../ui/icon";
import { EventPill } from "../event-pill";
import { StatusPill } from "../status-pill";

interface ActivityRowBaseProps {
  title: string;
  /** Short date, e.g. "Sat 28 Nov". */
  date: string;
  onClick?: () => void;
  className?: string;
}

/** A task row: a status pill (the default, as before UI-05). */
interface TaskActivityRowProps extends ActivityRowBaseProps {
  kind?: "task";
  status: OccurrenceStatus;
  actorName?: string;
}

/** A plain-event row (UI-05, CHG-009): no status, a neutral "Event" label instead. */
interface PlainEventActivityRowProps extends ActivityRowBaseProps {
  kind: "event";
  status?: never;
  actorName?: never;
}

export type ActivityRowProps = TaskActivityRowProps | PlainEventActivityRowProps;

/** Title, short date, status pill (or "Event" label) and chevron — Overdue card, Recent activity, Log panel (UI-03 PRD.md Scope). */
export function ActivityRow(props: ActivityRowProps) {
  const { title, date, onClick, className } = props;
  const content = (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-body-default text-text-primary">{title}</p>
        <p className="text-body-secondary text-text-secondary">{date}</p>
      </div>
      {props.kind === "event" ? (
        <EventPill className="shrink-0" />
      ) : (
        <StatusPill status={props.status} actorName={props.actorName} className="shrink-0" />
      )}
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
