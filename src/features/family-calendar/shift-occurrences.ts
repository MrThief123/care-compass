import type { ClientShift } from "@/server/events/queries";
import type { PlainEventOccurrence } from "@/types/domain";

/** Keys of the entries that stand for a shift on the grids start with this; they open nothing. */
export const SHIFT_KEY_PREFIX = "shift:";

export function isShiftEntry(occurrence: { key: string }): boolean {
  return occurrence.key.startsWith(SHIFT_KEY_PREFIX);
}

/**
 * A carer's shift drawn as a plain-event block ("Aisha Rahman on duty") so the day, week and month
 * grids show who is caring when, beside the care events. The shared grids take occurrences only,
 * and a plain event has no status, so nothing about a shift looks tickable.
 */
export function shiftsAsEntries(shifts: ClientShift[], clientId: string): PlainEventOccurrence[] {
  return shifts.map((shift) => ({
    kind: "event",
    key: `${SHIFT_KEY_PREFIX}${shift.id}`,
    eventId: shift.id,
    clientId,
    title: `${shift.carerName} on duty`,
    description: "",
    start: shift.start,
    durationMinutes: Math.max(
      0,
      Math.round((Date.parse(shift.end) - Date.parse(shift.start)) / 60_000),
    ),
  }));
}
