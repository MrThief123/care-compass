import { ADMIN_MANAGE } from "@/mocks/admin-manage";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";

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

/** Phase 1 mock contract. Live rostering belongs to ADM-06/ADM-07. */
export async function getAdminManage(): Promise<AdminManageData> {
  if (getDataSourceMode() === "mock") return structuredClone(ADMIN_MANAGE);
  notImplementedForSupabase("admin", "getAdminManage");
}
