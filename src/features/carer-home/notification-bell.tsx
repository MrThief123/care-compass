"use client";

import { usePathname, useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { markCarerNotificationsRead } from "@/server/notifications/actions";

export const NOTIFICATIONS_HREF = "/carer/home#carer-home-notifications";
const CARD_ID = "carer-home-notifications";

/**
 * The carer header's bell (CAR-02, FD-04, FD-05), handed to `PageHeader`'s `bellSlot`. The badge
 * is the unread count (a number, never colour alone; hidden at 0, `9+` above 9). A click marks
 * every notification read, refreshes the layout's count, then takes the carer to the
 * Notifications card: scroll and focus on Carer Home, a navigation from anywhere else. A failed
 * mark-read changes nothing else (the next load corrects the count) and logs no names.
 */
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleClick() {
    try {
      const result = await markCarerNotificationsRead();
      if (result.ok) router.refresh();
    } catch (error) {
      // The error's class only: the message may carry user data (ARCHITECTURE.md §12.5).
      console.error(
        "[notifications] could not mark notifications read:",
        error instanceof Error ? error.name : "unknown",
      );
    }

    if (pathname === "/carer/home") {
      const card = document.getElementById(CARD_ID);
      card?.scrollIntoView({ behavior: "smooth", block: "start" });
      card?.focus({ preventScroll: true });
    } else {
      router.push(NOTIFICATIONS_HREF);
    }
  }

  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleClick}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-inset text-text-secondary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Icon name="bell" size={20} />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 inline-flex min-w-5 items-center justify-center rounded-pill bg-bg-brand-deep px-1 text-body-secondary leading-5 text-text-on-dark"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
