import { CarerHomeErrorState } from "@/features/carer-home/carer-home-error-state";
import { CarerHomeView } from "@/features/carer-home/carer-home-view";
import { parseCalendarParams, visibleRange } from "@/features/family-calendar/calendar-params";
import { getCurrentUser } from "@/server/auth/queries";
import { getToday } from "@/server/events/queries";
import { getCarerNotifications } from "@/server/notifications/queries";
import { getCarerShifts } from "@/server/shifts/queries";

/**
 * Carer · Home (CHG-031). `?view=&date=&month=` picks what the Shifts calendar
 * draws, as on Family · Calendar, except that no view param means Day.
 */
export default async function CarerHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profileId } = await getCurrentUser("carer");

  let data;
  try {
    const today = await getToday();
    const params = parseCalendarParams({ view: "day", ...(await searchParams) }, today);
    const [shifts, notifications] = await Promise.all([
      getCarerShifts(profileId, visibleRange(params)),
      getCarerNotifications(profileId),
    ]);
    data = { today, params, shifts, notifications };
  } catch (error) {
    // A rejected query is the screen's error state. Log the error's class only:
    // the message may carry client data (ARCHITECTURE.md §12.5, no PII).
    console.error(
      "[carer-home] could not load home data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <CarerHomeErrorState />;
  }

  return <CarerHomeView {...data} />;
}
