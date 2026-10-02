import { instantToMelbourneLocal } from "@/lib/dates/melbourne-time";
import { listMockAssignments } from "@/server/admin/assignments-mock-store";
import { getDataSourceMode } from "@/server/data-source";

/** One carer's assignment to one client: the shifts they still hold with them (ADM-08). */
export interface CarerAssignment {
  carerId: string;
  clientId: string;
  /** Full name (CHG-032). */
  clientName: string;
  /** Non-cancelled shifts with this client that have not ended. */
  shiftCount: number;
  /** The earliest of those shifts, in Melbourne time. */
  nextShift: { date: string; start: string; end: string };
}

/**
 * The signed-in admin's organisation's carer-client assignments. There is no assignment table
 * (PD-041): a carer is assigned to a client while they have a non-cancelled shift with them that
 * has not ended, so the list is derived from `shifts`. RLS scopes the read to the caller's own
 * organisation; no manual `organisation_id` filter is needed.
 */
export async function getCarerAssignments(): Promise<{ assignments: CarerAssignment[] }> {
  if (getDataSourceMode() === "mock") {
    return { assignments: listMockAssignments() };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("carer_id, client_id, starts_at, ends_at, client:clients(first_name, last_name)")
    .is("cancelled_at", null)
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  // The message names no client (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getCarerAssignments: could not load the assignments.");

  const pairs = new Map<string, CarerAssignment>();
  for (const row of data) {
    const key = `${row.carer_id}:${row.client_id}`;
    const existing = pairs.get(key);
    if (existing) {
      existing.shiftCount += 1;
      continue;
    }
    const start = instantToMelbourneLocal(row.starts_at);
    const end = instantToMelbourneLocal(row.ends_at);
    pairs.set(key, {
      carerId: row.carer_id,
      clientId: row.client_id,
      clientName: [row.client?.first_name, row.client?.last_name].filter(Boolean).join(" "),
      shiftCount: 1,
      nextShift: { date: start.slice(0, 10), start: start.slice(11, 16), end: end.slice(11, 16) },
    });
  }
  // Rows arrive earliest first, so each pair's first row is its next shift.
  return {
    assignments: [...pairs.values()].sort((a, b) => a.clientName.localeCompare(b.clientName)),
  };
}
