import { ADMIN_SETTINGS } from "@/mocks/admin-settings";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";

export interface OrganisationSettings {
  name: string;
  abn: string;
  phone: string;
  address: string;
}
export interface AdminSettingsData {
  organisation: OrganisationSettings | null;
}

/** Phase 1 fixture contract; persistent organisation settings belong to ADM-10. */
export async function getAdminSettings(): Promise<AdminSettingsData> {
  if (getDataSourceMode() === "mock") return structuredClone(ADMIN_SETTINGS);
  notImplementedForSupabase("admin", "getAdminSettings");
}
