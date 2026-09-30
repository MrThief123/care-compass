import { NotificationRow } from "@/components/shared/lists/notification-row";
import type { CarerNotification } from "@/types/domain";

/**
 * A notification row with an unread marker (CAR-02, FD-04, FD-05): a dot plus the text 'Unread'
 * for assistive tech, so status is never colour alone. Read rows keep an empty gutter of the
 * same width so the chips line up. The shared `NotificationRow` is not edited.
 */
export function UnreadNotificationRow({ notification }: { notification: CarerNotification }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span
        className="flex h-11 w-3 shrink-0 items-center justify-center"
        aria-hidden={notification.read}
      >
        {!notification.read && (
          <>
            <span aria-hidden="true" className="size-2 rounded-pill bg-bg-brand-deep" />
            <span className="sr-only">Unread</span>
          </>
        )}
      </span>
      <NotificationRow
        source={notification.source}
        message={notification.message}
        className="min-w-0 flex-1"
      />
    </div>
  );
}
