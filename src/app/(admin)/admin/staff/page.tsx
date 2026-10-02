import { StaffScreen } from "@/features/admin-staff/staff-screen";
import { getCarerAssignments } from "@/server/admin/assignments-queries";
import { getAdminStaff } from "@/server/admin/staff-queries";

export default async function AdminStaffPage() {
  const [data, { assignments }] = await Promise.all([getAdminStaff(), getCarerAssignments()]);
  return <StaffScreen data={data} assignments={assignments} />;
}
