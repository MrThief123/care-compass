import { SettingsScreen } from "@/features/admin-settings/settings-screen";
import { getAdminSettings } from "@/server/admin/settings-queries";

export default async function AdminSettingsPage() {
  return <SettingsScreen data={await getAdminSettings()} />;
}
