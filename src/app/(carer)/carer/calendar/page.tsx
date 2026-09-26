import { CarerCalendarView } from "@/features/carer-calendar/carer-calendar-view";
import { CarerHomeErrorState } from "@/features/carer-home/carer-home-error-state";
import { parseCalendarParams, visibleRange } from "@/features/family-calendar/calendar-params";
import { getCurrentUser } from "@/server/auth/queries";
import { getToday } from "@/server/events/queries";
import { getCarerShifts } from "@/server/shifts/queries";

/**
 * Carer · Calendar (CAR-UI-03). `?view=&date=&month=` picks what is drawn, as
 * on Family · Calendar; the visible days are read with `getCarerShifts`.
 */
export default async function CarerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profileId } = await getCurrentUser("carer");

  let data;
  try {
    const today = await getToday();
    const params = parseCalendarParams(await searchParams, today);
    const shifts = await getCarerShifts(profileId, visibleRange(params));
    data = { today, params, shifts };
  } catch (error) {
    // A rejected query is the screen's error state. Log the error's class only:
    // the message may carry client data (ARCHITECTURE.md §12.5, no PII).
    console.error(
      "[carer-calendar] could not load shifts:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <CarerHomeErrorState />;
  }

  return <CarerCalendarView {...data} />;
}
