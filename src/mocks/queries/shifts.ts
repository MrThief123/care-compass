/**
 * Mock (fixture-backed) implementation of the `shifts` domain contract.
 * Read only by `src/server/shifts/queries.ts` — never imported directly by
 * `src/app` or `src/features`.
 */
import { ageFromDob } from "@/lib/format/age";
import { CLIENTS, REFERENCE_DATE, SHIFTS } from "@/mocks/fixtures";
import { melbourneDateKey } from "@/mocks/melbourne-time";
import { getToday } from "@/mocks/queries/events";
import type { CarerPatientRow, CarerShiftRow } from "@/server/shifts/queries";

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

export async function getCarerPatients(carerId: string): Promise<CarerPatientRow[]> {
  const now = Date.parse(REFERENCE_DATE);
  const soonest = new Map<string, { start: number; onShift: boolean }>();
  for (const shift of SHIFTS) {
    const start = Date.parse(shift.start);
    if (shift.carerId !== carerId || Date.parse(shift.end) <= now) continue;
    const seen = soonest.get(shift.clientId);
    soonest.set(shift.clientId, {
      start: Math.min(start, seen?.start ?? Infinity),
      onShift: (seen?.onShift ?? false) || start <= now,
    });
  }
  return [...soonest]
    .sort(([, a], [, b]) => a.start - b.start)
    .flatMap(([clientId, { onShift }]) => {
      const client = CLIENTS.find((candidate) => candidate.id === clientId);
      if (!client) return [];
      return [
        {
          clientId,
          firstName: client.firstName,
          age: ageFromDob(client.dob, REFERENCE_DATE),
          suburb: client.suburb ?? "",
          onShift,
        },
      ];
    });
}
