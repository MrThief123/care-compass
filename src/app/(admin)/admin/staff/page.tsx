import { StaffScreen } from "@/features/admin-staff/staff-screen";
import { getAdminStaff } from "@/server/admin/staff-queries";

export default async function AdminStaffPage() {
  return <StaffScreen data={await getAdminStaff()} />;
}
