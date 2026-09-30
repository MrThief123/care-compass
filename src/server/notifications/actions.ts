"use server";

/**
 * `notifications` domain Server Actions (CAR-02, FD-04, FD-06). Result shape per
 * ARCHITECTURE.md §4, never throwing to the client for an expected failure. The database is the
 * authority: RLS lets a carer update only `read_at` on their own rows, so this action is not the
 * only lock.
 */
import * as mock from "@/mocks/queries/notifications";
import { getCurrentUser } from "@/server/auth/queries";
import { getDataSourceMode } from "@/server/data-source";

export type NotificationActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: { code: "NOT_ALLOWED" | "UNEXPECTED"; message: string } };

const FAILED = "Couldn't mark your notifications as read.";

/** Marks all of the signed-in carer's unread notifications read (the bell's click). */
export async function markCarerNotificationsRead(): Promise<NotificationActionResult> {
  try {
    if (getDataSourceMode() === "mock") {
      const user = await getCurrentUser("carer");
      await mock.markCarerNotificationsRead(user.profileId);
      return { ok: true, data: undefined };
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return {
        ok: false,
        error: { code: "NOT_ALLOWED", message: "Sign in to see your notifications." },
      };
    }
    const { error } = await supabase
      .from("carer_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", auth.user.id)
      .is("read_at", null);
    if (error) return { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
    return { ok: true, data: undefined };
  } catch (error) {
    // A feature tag and the error's class only: the message may carry user data (ARCHITECTURE.md §12.5).
    console.error(
      "[notifications] markCarerNotificationsRead failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
  }
}
