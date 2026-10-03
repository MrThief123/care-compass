import { FamilyInfoView } from "@/features/family-info/family-info-view";
import { loadFamilyInfoData, type FamilyInfoData } from "@/features/family-info/info-data";
import { InfoErrorState } from "@/features/family-info/info-error-state";

/** Admin · client Info (ADM-11): the Family Info with edit and documents (RLS allows admins). */
export default async function AdminClientInfoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let data: FamilyInfoData;
  try {
    data = await loadFamilyInfoData(clientId);
  } catch (error) {
    console.error(
      "[admin-client-view] could not load info data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <InfoErrorState />;
  }

  return <FamilyInfoView clientId={clientId} data={data} canEdit />;
}
