import { StatusPill } from "@/components/shared/status-pill";
import { Icon } from "@/components/ui/icon";
import type { OccurrenceStatus } from "@/types/domain";

export interface RecentActivityRowProps {
  title: string;
  /** Short date, e.g. "Sat 28 Nov". */
  date: string;
  status: OccurrenceStatus;
  actorName?: string;
  onClick: () => void;
}

/**
 * The kit's `ActivityRow`, with the status pill capped at 55% of the row.
 *
 * `ActivityRow` renders its pill `shrink-0` and gives the caller no way to
 * size it, so a long carer name ("Done · Aisha Rahman-Featherstonehaugh", PD-038
 * shows full names) fills the whole row: the title collapses to a sliver and the
 * chevron spills out of the card. Capping the pill lets its own text truncate
 * and leaves the title room. Remove this wrapper and use `ActivityRow` again
 * once the kit caps the pill itself (DECISIONS.md FD-06).
 */
export function RecentActivityRow({
  title,
  date,
  status,
  actorName,
  onClick,
}: RecentActivityRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border-subtle py-2 text-left"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-body-default text-text-primary">{title}</p>
        <p className="text-body-secondary text-text-secondary">{date}</p>
      </div>
      <StatusPill status={status} actorName={actorName} className="max-w-[55%] shrink-0" />
      <Icon name="chevron-right" size={16} className="shrink-0 text-text-secondary" aria-hidden />
    </button>
  );
}
