import type { IconName } from "@/components/ui/icon";
import { isPlainEvent } from "@/types/domain";
import type { AnyOccurrence, OccurrenceStatus } from "@/types/domain";

export interface StatusCue {
  /** Background utility for the block/chip's left accent bar. */
  bar: string;
  /** Shape cue that backs the colour; `planned` is the plain default. */
  icon?: IconName;
  /** The status word, rendered visibly or for screen readers. */
  label: string;
}

/**
 * The status cue every calendar surface uses, at every density.
 *
 * `StatusPill` is the full treatment, but it is far too wide for a month chip
 * or a 22px block — and status is the one thing a care calendar must not hide
 * behind a click (an overdue medication has to look overdue at a glance). So
 * the compact surfaces carry this reduced cue instead: a coloured bar, backed
 * by a shape for `done`/`overdue` and by the status word for screen readers,
 * so status is never conveyed by colour alone (CLAUDE.md §7).
 */
export const STATUS_CUE: Record<OccurrenceStatus, StatusCue> = {
  planned: { bar: "bg-bg-muted", label: "Planned" },
  done: { bar: "bg-bg-brand", icon: "check", label: "Done" },
  overdue: { bar: "bg-bg-alert-strong", icon: "alert-triangle", label: "Overdue" },
};

/**
 * The cue for a plain event (UI-05, CHG-009): it has no status, so it gets a
 * neutral stripe, no check or alert shape, and the word "Event" in place of a
 * status word. On compact surfaces, where the word is read out only, the
 * stripe colour alone sets it apart from a Planned task — accepted for event
 * type by CHG-010; status itself is never colour alone.
 */
export const EVENT_CUE: StatusCue = { bar: "bg-text-secondary", label: "Event" };

/** The cue for any occurrence: the event cue for a plain event, else its status cue. */
export function occurrenceCue(occurrence: AnyOccurrence): StatusCue {
  return isPlainEvent(occurrence) ? EVENT_CUE : STATUS_CUE[occurrence.status];
}
