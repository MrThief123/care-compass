/**
 * `notifications` domain query contract. Authored by CAR-UI-01 (CHG-025,
 * FD-02): a carer's notifications are shift assigned, changed and cancelled
 * only. Same data-source-adapter shape as the other domains
 * (ARCHITECTURE.md §3.2). Screens must import from here, never from
 * `src/mocks` directly.
 */
import * as mock from "@/mocks/queries/notifications";
import { getDataSourceMode } from "@/server/data-source";
import type { CarerNotification } from "@/types/domain";

/** The most the card lists (FD-04): older rows stay in the table. */
const NOTIFICATION_LIMIT = 50;

/**
 * The carer's own notifications, newest first, at most 50. An unknown carer returns `[]`.
 * `DATA_SOURCE=supabase`: RLS returns only the signed-in carer's rows.
 */
export async function getCarerNotifications(carerId: string): Promise<CarerNotification[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getCarerNotifications(carerId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carer_notifications")
    .select("id, recipient_id, source, message, created_at, read_at")
    .eq("recipient_id", carerId)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIMIT);
  // The message names no carer or client (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getCarerNotifications: could not load notifications.");
  return data.map((row) => ({
    id: row.id,
    carerId: row.recipient_id,
    source: row.source === "family" ? "family" : "admin",
    message: row.message,
    createdAt: row.created_at,
    read: row.read_at !== null,
  }));
}

/** How many of the carer's notifications are unread (the bell's badge). */
export async function getCarerUnreadCount(carerId: string): Promise<number> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getCarerUnreadCount(carerId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("carer_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", carerId)
    .is("read_at", null);
  if (error || count === null) throw new Error("getCarerUnreadCount: could not load the count.");
  return count;
}
