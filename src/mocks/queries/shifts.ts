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
import type { OccurrenceRange } from "@/types/domain";

const fullName = (client?: { firstName: string; lastName: string }) =>
  client ? `${client.firstName} ${client.lastName}` : "";

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
      clientName: fullName(CLIENTS.find((client) => client.id === shift.clientId)),
    }));
}

export async function getCarerTodayShifts(carerId: string): Promise<CarerShiftRow[]> {
  const today = await getToday();
  return getCarerShifts(carerId, { from: today, to: today });
}

export async function getCarerPatients(carerId: string, query = ""): Promise<CarerPatientRow[]> {
  const now = Date.parse(REFERENCE_DATE);
  const needle = query.trim().toLowerCase();
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
      const name = `${client.firstName} ${client.lastName}`;
      if (!name.toLowerCase().includes(needle)) return [];
      return [
        {
          clientId,
          firstName: client.firstName,
          name,
          age: ageFromDob(client.dob, REFERENCE_DATE),
          suburb: client.suburb ?? "",
          onShift,
        },
      ];
    });
}
