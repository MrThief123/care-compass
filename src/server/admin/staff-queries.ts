import { adminStaffFixture } from "@/mocks/admin-staff";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

export interface AdminStaffData {
  staff: StaffMember[];
  roles: string[];
}

/** Phase-one contract. Changes in the Staff screen stay in local component state. */
export async function getAdminStaff(): Promise<AdminStaffData> {
  if (getDataSourceMode() === "mock") return structuredClone(adminStaffFixture);
  return notImplementedForSupabase("admin", "getAdminStaff");
}
