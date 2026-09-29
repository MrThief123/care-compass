import { ClientsScreen } from "@/features/admin-clients/clients-screen";
import { getAdminClients } from "@/server/admin/clients-queries";

export default async function AdminClientsPage() {
  return <ClientsScreen data={await getAdminClients()} />;
}
