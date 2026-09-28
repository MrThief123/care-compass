/**
 * Mock (fixture-backed) implementation of the `notifications` domain contract.
 * Read only by `src/server/notifications/queries.ts` — never imported directly
 * by `src/app` or `src/features`.
 */
import { CARER_NOTIFICATIONS } from "@/mocks/fixtures";
import type { CarerNotification } from "@/types/domain";

export async function getCarerNotifications(carerId: string): Promise<CarerNotification[]> {
  return CARER_NOTIFICATIONS.filter((notification) => notification.carerId === carerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((notification) => ({ ...notification }));
}
