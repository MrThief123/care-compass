/**
 * Mock (fixture-backed) implementation of the `notifications` domain contract.
 * Read only by `src/server/notifications/*` — never imported directly
 * by `src/app` or `src/features`.
 */
import { CARER_NOTIFICATIONS } from "@/mocks/fixtures";
import type { CarerNotification } from "@/types/domain";

// CAR-02 (FD-04): the fixture module is never rewritten; marking read flips `read` on this copy
// so the dev preview behaves (it resets when the server restarts).
const rows: CarerNotification[] = CARER_NOTIFICATIONS.map((notification) => ({ ...notification }));

export async function getCarerNotifications(carerId: string): Promise<CarerNotification[]> {
  return rows
    .filter((notification) => notification.carerId === carerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((notification) => ({ ...notification }));
}

export async function getCarerUnreadCount(carerId: string): Promise<number> {
  return rows.filter((notification) => notification.carerId === carerId && !notification.read)
    .length;
}

/** Marks every notification of the carer read. */
export async function markCarerNotificationsRead(carerId: string): Promise<void> {
  for (const notification of rows) {
    if (notification.carerId === carerId) notification.read = true;
  }
}
