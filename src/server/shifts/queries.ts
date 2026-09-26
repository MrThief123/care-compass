/**
 * `shifts` domain query contract. Authored by CAR-UI-01 (CHG-025, FD-02):
 * Carer Home's "Today's calendar" lists the carer's shifts. Same
 * data-source-adapter shape as the other domains (ARCHITECTURE.md §3.2).
 * Screens must import from here, never from `src/mocks` directly.
 */
import * as mock from "@/mocks/queries/shifts";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import { OccurrenceRangeSchema, type OccurrenceRange, type Shift } from "@/types/domain";

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
  notImplementedForSupabase("shifts", "getCarerShifts");
}
