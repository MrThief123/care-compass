import { isPlainEvent, type Occurrence } from "@/types/domain";

/**
 * The Tasks panel's local ticks, drawn on the grids (CHG-016). Display only: nothing is saved
 * (FAM-05 wires `setOccurrenceDone`). A ticked task shows Done with the signed-in person's name;
 * an unticked one shows its original status, except that a task that was Done shows Planned,
 * without its old name. A task left alone, and a plain event, are returned as they are.
 */
export function applyTick(
  occurrence: Occurrence,
  ticked: boolean | undefined,
  actorName: string,
): Occurrence {
  if (ticked === undefined || isPlainEvent(occurrence)) return occurrence;
  const wasDone = occurrence.status === "done";
  if (ticked === wasDone) return occurrence;
  if (ticked) return { ...occurrence, status: "done", actor: actorName };
  return { ...occurrence, status: "planned", actor: undefined, completedAt: undefined };
}
