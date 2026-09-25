import { cn } from "@/lib/utils";

export interface EventPillProps {
  className?: string;
}

/**
 * The neutral "Event" label that stands where a `StatusPill` would for a plain
 * event (UI-05, CHG-009). A plain event is never ticked off, so it carries no
 * status icon and no actor — just the word, in neutral tokens.
 */
export function EventPill({ className }: EventPillProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-pill border border-border-default bg-bg-surface px-2 py-1 text-body-small font-medium text-text-secondary",
        className,
      )}
    >
      Event
    </span>
  );
}
