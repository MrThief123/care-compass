import { FamilyInfoView } from "@/features/family-info/family-info-view";
import { loadFamilyInfoData, type FamilyInfoData } from "@/features/family-info/info-data";
import { InfoErrorState } from "@/features/family-info/info-error-state";

export default async function FamilyInfoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let data: FamilyInfoData;
  try {
    data = await loadFamilyInfoData(clientId);
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

  return <FamilyInfoView data={data} canEdit />;
}
