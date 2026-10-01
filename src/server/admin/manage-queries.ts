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

/**
 * Staff and client lists for Manage (ADM-06). Search runs server-side (D32): a case-insensitive
 * contains match on first or last name. Supabase mode reads under RLS, so only the admin's own
 * organisation appears, and only active carers (FD-04). Shifts stay empty until ADM-07 wires them.
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
  const [staff, clients] = await Promise.all([
    staffQuery.order("first_name").order("last_name"),
    clientQuery.order("first_name").order("last_name"),
  ]);
  // The message names no client (ARCHITECTURE.md §12.5).
  if (staff.error || !staff.data || clients.error || !clients.data) {
    throw new Error("getAdminManage: could not load staff and clients.");
  }
  const toPerson = (row: { id: string; first_name: string | null; last_name: string | null }) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" "),
  });
  return {
    referenceDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(
      new Date(),
    ),
    staff: staff.data.map(toPerson),
    clients: clients.data.map(toPerson),
    shifts: [],
  };
}
