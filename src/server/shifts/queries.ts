/**
 * `shifts` domain query contract. Authored by CAR-UI-01 (CHG-025, FD-02):
 * Carer Home's "Today's calendar" lists the carer's shifts. Same
 * data-source-adapter shape as the other domains (ARCHITECTURE.md §3.2).
 * Screens must import from here, never from `src/mocks` directly.
 */
import * as mock from "@/mocks/queries/shifts";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { Shift } from "@/types/domain";

/** A shift with the client's first name, which is all Carer Home shows of the client. */
export type CarerShiftRow = Shift & { clientFirstName: string };

/**
 * The carer's shifts that start on today's Melbourne calendar day (the day
 * `getToday()` answers), earliest first (FD-03). A shift that started
 * yesterday is not listed. An unknown carer returns `[]`.
 */
export async function getCarerTodayShifts(carerId: string): Promise<CarerShiftRow[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getCarerTodayShifts(carerId);
  }
  notImplementedForSupabase("shifts", "getCarerTodayShifts");
}

/** One card on Carer · Patients (CAR-UI-02 FD-02). */
export interface CarerPatientRow {
  clientId: string;
  firstName: string;
  age: number;
  suburb: string;
  /** A shift with this client is in progress now: the carer may edit their Info. */
  onShift: boolean;
}

/**
 * The clients the carer has a shift with that hasn't ended (PD-041), soonest
 * shift first (FD-03). An unknown carer returns `[]`.
 */
export async function getCarerPatients(carerId: string): Promise<CarerPatientRow[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getCarerPatients(carerId);
  }
  notImplementedForSupabase("shifts", "getCarerPatients");
}
