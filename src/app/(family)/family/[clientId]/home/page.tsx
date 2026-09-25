import { FamilyHomeView } from "@/features/family-home/family-home-view";
import { loadFamilyHomeData, type FamilyHomeData } from "@/features/family-home/home-data";
import { HomeErrorState } from "@/features/family-home/home-error-state";

export default async function FamilyHomePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let data: FamilyHomeData;
  try {
    data = await loadFamilyHomeData(clientId);
  } catch (error) {
    // A rejected contract query is the screen's error state, not a crash.
    // ARCHITECTURE.md §12.5: log a feature tag and the error's class only. The
    // message is left out because Phase 3 data-layer errors may carry client
    // data, and nothing here may log PII. See DECISIONS.md FD-07.
    console.error(
      "[family-home] could not load home data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <HomeErrorState />;
  }

  return <FamilyHomeView clientId={clientId} data={data} today={new Date()} />;
}
