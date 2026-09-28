import { AdminHomeScreen } from "@/features/admin-home/admin-home-screen";
import { getAdminHome } from "@/server/admin/queries";

export default async function AdminHomePage() {
  const data = await getAdminHome();
  return <AdminHomeScreen data={data} />;
}
