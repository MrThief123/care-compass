import { ADMIN_CLIENTS } from "@/mocks/admin-clients";
import { isMockClientRemoved } from "@/server/admin/clients-mock-store";
import { getDataSourceMode } from "@/server/data-source";

export interface AdminClient {
  id: string;
  name: string;
  familyContact: string;
}
export interface AdminClientsData {
  clients: AdminClient[];
}

function fullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

/**
 * The signed-in admin's organisation's clients (ADM-04, read-only — see feature DECISIONS.md FD-01
 * for why there is no write path here any more, CHG-035). RLS scopes a plain `select` to the caller's
 * own organisation (`clients_select_admin`), same as ADM-01/ADM-02's reads. `familyContact` is the
 * client's first linked family member (by first name, for determinism), or "—" for none — both
 * undesigned corners (PRD.md Error/Edge Cases, PROPOSED).
 */
export async function getAdminClients(): Promise<AdminClientsData> {
  if (getDataSourceMode() === "mock") {
    const data = structuredClone(ADMIN_CLIENTS);
    return { ...data, clients: data.clients.filter((client) => !isMockClientRemoved(client.id)) };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, first_name, last_name, family:client_family_members(profile:profiles(first_name, last_name))",
    )
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });
  // The message names no client (ARCHITECTURE.md §12.5).
  if (error || !data)
    throw new Error("getAdminClients: could not load the organisation's clients.");

  return {
    clients: data.map((row) => {
      const contacts = row.family
        .map((link) => fullName(link.profile?.first_name ?? null, link.profile?.last_name ?? null))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      return {
        id: row.id,
        name: fullName(row.first_name, row.last_name),
        familyContact: contacts[0] ?? "—",
      };
    }),
  };
}
