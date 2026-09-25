import { ADMIN_HOME } from "@/mocks/admin-home";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";

export interface AdminHomeData {
  clientCount: number;
  staffCount: number;
  upcomingShifts: {
    id: string;
    clientName: string;
    carerName: string;
    date: string;
    time: string;
  }[];
  overdue: { id: string; clientName: string; eventTitle: string; nurseName: string }[];
}

/** Phase 1 contract; live organisation-scoped data belongs to ADM-01. */
export async function getAdminHome(): Promise<AdminHomeData> {
  if (getDataSourceMode() === "mock") return structuredClone(ADMIN_HOME);
  notImplementedForSupabase("admin", "getAdminHome");
}
