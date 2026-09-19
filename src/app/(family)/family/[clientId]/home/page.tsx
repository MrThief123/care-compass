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
  } catch {
    // A rejected contract query is the screen's error state, not a crash.
    // Nothing is logged here: the Phase 3 data layer's messages may carry
    // client data (CLAUDE.md §7, no PII in logs). See DECISIONS.md FD-07.
    return <HomeErrorState />;
  }

  return <FamilyHomeView clientId={clientId} data={data} today={new Date()} />;
}
