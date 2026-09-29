import { ManageScreen } from "@/features/admin-manage/manage-screen";
import { getAdminManage } from "@/server/admin/manage-queries";

export default async function AdminManagePage() {
  return <ManageScreen data={await getAdminManage()} />;
}
