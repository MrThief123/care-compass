import { FamilyInfoView } from "@/features/family-info/family-info-view";
import { loadFamilyInfoData, type FamilyInfoData } from "@/features/family-info/info-data";
import { InfoErrorState } from "@/features/family-info/info-error-state";
import { assertAdminClientAccess } from "@/server/admin/client-access";
import { getClientCustomSections } from "@/server/clients/custom-sections";
import type { ClientCustomSection } from "@/types/domain";

/** Admin · client Info (ADM-11): the Family Info with edit and documents (RLS allows admins). */
export default async function AdminClientInfoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  // A layout does not stop its page rendering: check here too, outside the try, so a client the
  // admin may not open reads nothing and logs nothing (ADM-11 FD-03).
  await assertAdminClientAccess(clientId);

  let data: FamilyInfoData;
  let customSections: ClientCustomSection[];
  try {
    [data, customSections] = await Promise.all([
      loadFamilyInfoData(clientId),
      getClientCustomSections(clientId),
    ]);
  } catch (error) {
    console.error(
      "[admin-client-view] could not load info data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <InfoErrorState />;
  }

  return <FamilyInfoView clientId={clientId} data={data} customSections={customSections} canEdit />;
}
