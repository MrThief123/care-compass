import type { IconName } from "@/components/ui/icon";
import type { OccurrenceStatus } from "@/types/domain";

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
