/**
 * `notifications` domain query contract. Authored by CAR-UI-01 (CHG-025,
 * FD-02): a carer's notifications are shift assigned, changed and cancelled
 * only. Same data-source-adapter shape as the other domains
 * (ARCHITECTURE.md §3.2). Screens must import from here, never from
 * `src/mocks` directly.
 */
import * as mock from "@/mocks/queries/notifications";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { CarerNotification } from "@/types/domain";

/** The carer's own notifications, newest first. An unknown carer returns `[]`. */
export async function getCarerNotifications(carerId: string): Promise<CarerNotification[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getCarerNotifications(carerId);
  }
  notImplementedForSupabase("notifications", "getCarerNotifications");
}
