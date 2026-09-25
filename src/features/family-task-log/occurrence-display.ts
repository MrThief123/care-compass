import { displayName } from "@/lib/format/display-name";
import type { Occurrence } from "@/types/domain";

/** Shown where no carer's shift covers the occurrence (PD-055). */
export const NO_NURSE = "—";

/**
 * Which person to show for an occurrence (OQ-29, PD-055; full name per
 * PD-038): once Done, the actor who completed it; otherwise the carer whose
 * shift covers it; `—` if there is none.
 */
export function occurrenceNurse(
  occurrence: Pick<Occurrence, "status" | "actor" | "assignee">,
): string {
  const name =
    occurrence.status === "done" ? (occurrence.actor ?? occurrence.assignee) : occurrence.assignee;
  return (name ? displayName(name) : "") || NO_NURSE;
}
