import Link from "next/link";

import { BudgetBucketCard } from "@/components/shared/cards/budget-bucket-card";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { formatMoney } from "@/lib/format/money";
import type { BudgetBucketSummary } from "@/types/domain";

import { summariseBudget } from "./home-data";
import { homeRoutes } from "./home-routes";

export interface BudgetStripProps {
  clientId: string;
  buckets: BudgetBucketSummary[];
}

/** Budget strip: one aggregate line over the client's funding buckets, then a card per bucket. */
export function BudgetStrip({ clientId, buckets }: BudgetStripProps) {
  const totals = summariseBudget(buckets);

  return (
    <section aria-labelledby="family-home-budget">
      <CardShell className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="family-home-budget" className="text-title-section text-text-primary">
              Budget
            </h2>
            {buckets.length > 0 && (
              <p className="text-body-small text-text-secondary">
                {`${formatMoney(totals.remaining)} remaining of ${formatMoney(totals.total)} · ${totals.percentUsed}% used`}
              </p>
            )}
          </div>
          <Link
            href={homeRoutes.budget(clientId)}
            className="inline-flex min-h-11 items-center px-5 text-body-emphasis text-text-brand hover:underline"
          >
            View breakdown
          </Link>
        </div>
        {buckets.length === 0 ? (
          <EmptyState
            icon="dollar"
            title="No funding set up yet"
            body="Funding buckets will appear here once they are set up."
          />
        ) : (
          <ul className="mt-4 grid grid-cols-3 gap-4">
            {buckets.map((bucket) => (
              <li key={bucket.kind}>
                <BudgetBucketCard summary={bucket} className="h-full" />
              </li>
            ))}
          </ul>
        )}
      </CardShell>
    </section>
  );
}
