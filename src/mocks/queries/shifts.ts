/**
 * Mock (fixture-backed) implementation of the `shifts` domain contract.
 * Read only by `src/server/shifts/queries.ts` — never imported directly by
 * `src/app` or `src/features`.
 */
import { CLIENTS, SHIFTS } from "@/mocks/fixtures";
import { melbourneDateKey } from "@/mocks/melbourne-time";
import { getToday } from "@/mocks/queries/events";
import type { CarerShiftRow } from "@/server/shifts/queries";
import type { OccurrenceRange } from "@/types/domain";

/** `range` is already validated (`OccurrenceRangeSchema`). */
export async function getCarerShifts(
  carerId: string,
  { from, to }: OccurrenceRange,
): Promise<CarerShiftRow[]> {
  return SHIFTS.filter((shift) => {
    const day = melbourneDateKey(shift.start);
    return shift.carerId === carerId && day >= from && day <= to;
  })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .map((shift) => ({
      ...shift,
      clientFirstName: CLIENTS.find((client) => client.id === shift.clientId)?.firstName ?? "",
    }));
}

export async function getCarerTodayShifts(carerId: string): Promise<CarerShiftRow[]> {
  const today = await getToday();
  return getCarerShifts(carerId, { from: today, to: today });
}
