import { BudgetHolder } from "@/features/family-budget/budget-holder";

import type { ReactNode } from "react";

/**
 * Holds what an Edit budget save changes while the family moves between Budget
 * and Edit budget (CHG-021, DECISIONS.md FD-12). A layout stays mounted across
 * those navigations, so the change survives them; a reload drops it. It reads
 * nothing and draws nothing of its own.
 */
export default function BudgetLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  return <BudgetHolder>{children}</BudgetHolder>;
}
