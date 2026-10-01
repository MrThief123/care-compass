import { ManageScreen } from "@/features/admin-manage/manage-screen";
import { getAdminManage } from "@/server/admin/manage-queries";

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default async function AdminManagePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const staffSearch = first(params.staffQ);
  const clientSearch = first(params.clientQ);
  return (
    <ManageScreen
      data={await getAdminManage({ staffSearch, clientSearch })}
      selection={{ staffId: first(params.staff), clientId: first(params.client) }}
      staffSearch={staffSearch}
      clientSearch={clientSearch}
    />
  );
}
