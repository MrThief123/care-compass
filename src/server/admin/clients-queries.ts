import { ADMIN_CLIENTS } from "@/mocks/admin-clients";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";

export interface AdminClient {
  id: string;
  name: string;
  familyContact: string;
}
export interface AdminClientsData {
  clients: AdminClient[];
}

/** Phase 1 fixture contract. Live organisation-scoped access belongs to ADM-04. */
export async function getAdminClients(): Promise<AdminClientsData> {
  if (getDataSourceMode() === "mock") return structuredClone(ADMIN_CLIENTS);
  notImplementedForSupabase("admin", "getAdminClients");
}
