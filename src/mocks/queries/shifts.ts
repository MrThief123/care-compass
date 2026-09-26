/**
 * Mock (fixture-backed) implementation of the `shifts` domain contract.
 * Read only by `src/server/shifts/queries.ts` — never imported directly by
 * `src/app` or `src/features`.
 */
import { CLIENTS, SHIFTS } from "@/mocks/fixtures";
import { melbourneDateKey } from "@/mocks/melbourne-time";
import { getToday } from "@/mocks/queries/events";
import type { CarerShiftRow } from "@/server/shifts/queries";

export async function getCarerTodayShifts(carerId: string): Promise<CarerShiftRow[]> {
  const today = await getToday();
  return SHIFTS.filter(
    (shift) => shift.carerId === carerId && melbourneDateKey(shift.start) === today,
  )
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .map((shift) => ({
      ...shift,
      clientFirstName: CLIENTS.find((client) => client.id === shift.clientId)?.firstName ?? "",
    }));
}
