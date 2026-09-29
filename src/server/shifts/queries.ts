/**
 * `shifts` domain query contract. Authored by CAR-UI-01 (CHG-025, FD-02):
 * Carer Home's "Today's calendar" lists the carer's shifts. Same
 * data-source-adapter shape as the other domains (ARCHITECTURE.md §3.2).
 * Screens must import from here, never from `src/mocks` directly.
 */
import { instantToMelbourneLocal, localToMelbourneIso } from "@/lib/dates/melbourne-time";
import * as mock from "@/mocks/queries/shifts";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import { OccurrenceRangeSchema, type OccurrenceRange, type Shift } from "@/types/domain";

/** A shift with the client's full name, which is all the carer's calendar shows of the client. */
export type CarerShiftRow = Shift & { clientName: string };

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

/**
 * The carer's shifts that start on a Melbourne day from `range.from` to
 * `range.to`, both inclusive, earliest first (CAR-UI-03, CHG-030). `range` is
 * parsed with `OccurrenceRangeSchema`, so a backwards or over-long range
 * rejects. An unknown carer returns `[]`.
 */
export async function getCarerShifts(
  carerId: string,
  range: OccurrenceRange,
): Promise<CarerShiftRow[]> {
  const parsed = OccurrenceRangeSchema.parse(range);
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getCarerShifts(carerId, parsed);
  }
  // Melbourne midnight of `from` to Melbourne midnight after `to`.
  const dayAfterTo = new Date(`${parsed.to}T00:00:00Z`);
  dayAfterTo.setUTCDate(dayAfterTo.getUTCDate() + 1);
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_carer_shifts", {
    p_carer_id: carerId,
    p_from: new Date(localToMelbourneIso(`${parsed.from}T00:00`)).toISOString(),
    p_to: new Date(
      localToMelbourneIso(`${dayAfterTo.toISOString().slice(0, 10)}T00:00`),
    ).toISOString(),
  });
  // Generic message: the database error may carry a client or carer name.
  if (error) throw new Error("getCarerShifts: could not load shifts.");
  const toMelbourne = (instant: string) => localToMelbourneIso(instantToMelbourneLocal(instant));
  return data.map((row) => ({
    id: row.id,
    carerId: row.carer_id,
    clientId: row.client_id,
    start: toMelbourne(row.starts_at),
    end: toMelbourne(row.ends_at),
    clientName: `${row.client_first_name} ${row.client_last_name}`,
  }));
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
