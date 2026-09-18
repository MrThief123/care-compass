import { cn } from "@/lib/utils";
import type { OccurrenceStatus } from "@/types/domain";

import { Icon } from "../ui/icon";

export interface StatusPillProps {
  status: OccurrenceStatus;
  /** Required for status "done" (REQ-19: completion records who did it). */
  actorName?: string;
  className?: string;
}

const BASE =
  "inline-flex max-w-full items-center gap-1 rounded-pill px-2 py-1 text-body-small font-medium";

export function StatusPill({ status, actorName, className }: StatusPillProps) {
  if (status === "done") {
    return (
      <span className={cn(BASE, "bg-bg-brand-pale text-text-brand", className)}>
        <Icon name="check" size={14} />
        <span className="truncate">Done · {actorName}</span>
      </span>
    );
  }

  if (status === "overdue") {
    return (
      <span
        className={cn(BASE, "border border-border-alert bg-transparent text-text-alert", className)}
      >
        <Icon name="alert-triangle" size={14} />
        Overdue
      </span>
    );
  }

  return (
    <span
      className={cn(
        BASE,
        "border border-border-default bg-transparent text-text-secondary",
        className,
      )}
    >
      Planned
    </span>
  );
}
