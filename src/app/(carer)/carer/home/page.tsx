import { CarerHomeErrorState } from "@/features/carer-home/carer-home-error-state";
import { CarerHomeView } from "@/features/carer-home/carer-home-view";
import { getCurrentUser } from "@/server/auth/queries";
import { getCarerNotifications } from "@/server/notifications/queries";
import { getCarerTodayShifts } from "@/server/shifts/queries";

export default async function CarerHomePage() {
  const { profileId } = await getCurrentUser("carer");

  let data;
  try {
    const [shifts, notifications] = await Promise.all([
      getCarerTodayShifts(profileId),
      getCarerNotifications(profileId),
    ]);
    data = { shifts, notifications };
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
