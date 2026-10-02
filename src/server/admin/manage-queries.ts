import {
  instantToMelbourneLocal,
  localToMelbourneIso,
  melbourneDateKey,
} from "@/lib/dates/melbourne-time";
import { ADMIN_MANAGE } from "@/mocks/admin-manage";
import { getDataSourceMode } from "@/server/data-source";

export interface ManagePerson {
  id: string;
  name: string;
}
export interface ManageShift {
  id: string;
  staffId: string;
  clientId: string;
  date: string;
  start: string;
  end: string;
  /**
   * The carer's and client's names, read with the shift (ADM-07), so the overlap warning can name a
   * client who isn't in the (searched) client list. Absent on fixtures, which use the lists.
   */
  staffName?: string;
  clientName?: string;
}
export interface AdminManageData {
  referenceDate: string;
  staff: ManagePerson[];
  clients: ManagePerson[];
  shifts: ManageShift[];
}

export interface AdminManageSearch {
  staffSearch?: string;
  clientSearch?: string;
}

function matchesName(name: string, search?: string) {
  const term = search?.trim().toLowerCase();
  return !term || name.toLowerCase().includes(term);
}

/** Case-insensitive contains pattern for PostgREST `or()`: drops characters that would break it. */
function likePattern(search: string) {
  return `%${search.replace(/[%_\\,()*]/g, " ").trim()}%`;
}

type NameRow = { first_name: string | null; last_name: string | null } | null;
const fullName = (row: NameRow | undefined) =>
  row ? [row.first_name, row.last_name].filter(Boolean).join(" ") : "";

/** A `shifts` row as Manage shows it: Melbourne date and `HH:MM` times (ADM-07). */
export function toManageShift(
  row: { id: string; carer_id: string; client_id: string; starts_at: string; ends_at: string },
  names: { carer?: NameRow; client?: NameRow } = {},
): ManageShift {
  const start = instantToMelbourneLocal(row.starts_at);
  const end = instantToMelbourneLocal(row.ends_at);
  const date = start.slice(0, 10);
  const staffName = fullName(names.carer);
  const clientName = fullName(names.client);
  return {
    id: row.id,
    staffId: row.carer_id,
    clientId: row.client_id,
    date,
    start: start.slice(11, 16),
    // Manage shows one day per shift: one running past midnight is shown to the end of its day (FD-04).
    end: end.slice(0, 10) === date ? end.slice(11, 16) : "24:00",
    ...(staffName ? { staffName } : {}),
    ...(clientName ? { clientName } : {}),
  };
}

/** Melbourne midnight on the 1st of the month before `date` (`YYYY-MM-DD`), as a UTC instant. */
function startOfPreviousMonth(date: string) {
  const [year = 1970, month = 1] = date.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
  return new Date(localToMelbourneIso(`${first}T00:00`)).toISOString();
}

/**
 * Staff and client lists for Manage (ADM-06). Search runs server-side (D32): a case-insensitive
 * contains match on first or last name. Supabase mode reads under RLS, so only the admin's own
 * organisation appears, only active carers (FD-04) who have signed up (ADM-08 FD-08: invited carers are left out). Shifts (ADM-07) are the organisation's
 * non-cancelled shifts that end on or after the 1st of last month (ADM-07 FD-03), also read under
 * RLS, with the carer's and client's names; they drive the date dots, the day's bookings and the
 * overlap warning.
 */
export async function getAdminManage(search: AdminManageSearch = {}): Promise<AdminManageData> {
  if (getDataSourceMode() === "mock") {
    const data = structuredClone(ADMIN_MANAGE);
    return {
      ...data,
      staff: data.staff.filter((person) => matchesName(person.name, search.staffSearch)),
      clients: data.clients.filter((person) => matchesName(person.name, search.clientSearch)),
    };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const staffTerm = search.staffSearch?.trim() ? likePattern(search.staffSearch) : "";
  const clientTerm = search.clientSearch?.trim() ? likePattern(search.clientSearch) : "";

  let staffQuery = supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "carer")
    .eq("is_active", true);
  if (staffTerm) {
    staffQuery = staffQuery.or(`first_name.ilike.${staffTerm},last_name.ilike.${staffTerm}`);
  }
  let clientQuery = supabase.from("clients").select("id, first_name, last_name");
  if (clientTerm) {
    clientQuery = clientQuery.or(`first_name.ilike.${clientTerm},last_name.ilike.${clientTerm}`);
  }
  const referenceDate = melbourneDateKey(new Date().toISOString());
  const [staff, clients, shifts, pending] = await Promise.all([
    staffQuery.order("first_name").order("last_name"),
    clientQuery.order("first_name").order("last_name"),
    supabase
      .from("shifts")
      .select(
        "id, carer_id, client_id, starts_at, ends_at, carer:profiles!shifts_carer_id_fkey(first_name, last_name), client:clients(first_name, last_name)",
      )
      .is("cancelled_at", null)
      .gte("ends_at", startOfPreviousMonth(referenceDate))
      .order("starts_at"),
    supabase.rpc("admin_pending_staff_ids"),
  ]);
  // The message names no client (ARCHITECTURE.md §12.5).
  if (staff.error || !staff.data || clients.error || !clients.data) {
    throw new Error("getAdminManage: could not load staff and clients.");
  }
  if (shifts.error || !shifts.data) {
    throw new Error("getAdminManage: could not load shifts.");
  }
  // Carers invited but not signed up yet can't be rostered, so they are not offered (ADM-08 FD-08).
  // Fails closed: without the list they could be shown, so the screen errors instead.
  if (pending.error || !pending.data) {
    throw new Error("getAdminManage: could not load which carers have signed up.");
  }
  const pendingIds = new Set(pending.data);
  const toPerson = (row: { id: string; first_name: string | null; last_name: string | null }) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" "),
  });
  return {
    referenceDate,
    staff: staff.data.filter((row) => !pendingIds.has(row.id)).map(toPerson),
    clients: clients.data.map(toPerson),
    shifts: shifts.data.map(({ carer, client, ...row }) => toManageShift(row, { carer, client })),
  };
}
