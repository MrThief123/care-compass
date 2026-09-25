import { loadFamilyBudgetData, type FamilyBudgetData } from "@/features/family-budget/budget-data";
import { BudgetErrorState } from "@/features/family-budget/budget-error-state";
import { EditBudgetView } from "@/features/family-budget/edit-budget-view";

export default async function EditBudgetPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let data: FamilyBudgetData;
  try {
    data = await loadFamilyBudgetData(clientId);
  } catch (error) {
    // As on Budget (DECISIONS.md FD-07): a feature tag and the error's class
    // only, never its message, which may carry client data.
    console.error(
      "[family-budget] could not load budget data for editing:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <BudgetErrorState />;
  }

  return <EditBudgetView clientId={clientId} data={data} />;
}
