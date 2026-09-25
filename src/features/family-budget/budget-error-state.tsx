"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

/**
 * Shown in place of the whole screen when the contract rejects (States sheet
 * error state). Retry asks the server to render the route again, which
 * re-runs the contract queries.
 */
export function BudgetErrorState() {
  const router = useRouter();

  return (
    <div className="px-6 py-5">
      <CardShell>
        <ErrorState onRetry={() => router.refresh()} />
      </CardShell>
    </div>
  );
}
