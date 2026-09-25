import { loadFamilyBudgetData, type FamilyBudgetData } from "@/features/family-budget/budget-data";
import { BudgetErrorState } from "@/features/family-budget/budget-error-state";
import { FamilyBudgetView } from "@/features/family-budget/family-budget-view";

export default async function FamilyBudgetPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let data: FamilyBudgetData;
  try {
    data = await loadFamilyBudgetData(clientId);
  } catch (error) {
    // A rejected contract query is the screen's error state, not a crash.
    // ARCHITECTURE.md §12.5: log a feature tag and the error's class only. The
    // message is left out because Phase 3 data-layer errors may carry client
    // data, and nothing here may log PII. See DECISIONS.md FD-07.
    console.error(
      "[family-budget] could not load budget data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <BudgetErrorState />;
  }

  return <FamilyBudgetView clientId={clientId} data={data} />;
}
