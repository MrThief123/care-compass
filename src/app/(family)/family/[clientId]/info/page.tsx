import { FamilyInfoView } from "@/features/family-info/family-info-view";
import { loadFamilyInfoData, type FamilyInfoData } from "@/features/family-info/info-data";
import { InfoErrorState } from "@/features/family-info/info-error-state";
import { getClientDetails, type ClientDetails } from "@/server/clients/client-details";
import { getClientCustomSections } from "@/server/clients/custom-sections";
import type { ClientCustomSection } from "@/types/domain";

export default async function FamilyInfoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let data: FamilyInfoData;
  let customSections: ClientCustomSection[];
  let personalDetails: ClientDetails;
  try {
    [data, customSections, personalDetails] = await Promise.all([
      loadFamilyInfoData(clientId),
      getClientCustomSections(clientId),
      getClientDetails(clientId),
    ]);
  } catch (error) {
    // A rejected contract read is the screen's error state, not a crash.
    // ARCHITECTURE.md §12.5: log a feature tag and the error's class only. The
    // message is left out because Phase 3 data-layer errors may carry client
    // data, and nothing here may log PII.
    console.error(
      "[family-info] could not load info data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <InfoErrorState />;
  }

  return (
    <FamilyInfoView
      clientId={clientId}
      data={data}
      customSections={customSections}
      personalDetails={personalDetails}
      settingsHref={`/family/${clientId}/settings`}
      canEdit
    />
  );
}
