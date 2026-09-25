import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BudgetBucketSummary } from "@/types/domain";

import { BudgetBucketCard } from "./budget-bucket-card";

const GOVERNMENT_ALERT: BudgetBucketSummary = {
  id: "bucket-government",
  kind: "government",
  label: "Government",
  total: 3000,
  used: 2760,
  remaining: 240,
  percentUsed: 92,
  state: "alert",
};

describe("BudgetBucketCard", () => {
  it("[UI-03][AC-01] shows the remaining amount, usage line, warning icon and alert tone for an alert-state bucket", () => {
    render(<BudgetBucketCard summary={GOVERNMENT_ALERT} />);

    expect(screen.getByText("$240")).toBeInTheDocument();
    expect(screen.getByText("of $3,000 · 92% used")).toBeInTheDocument();
    expect(screen.getByTestId("icon-alert-triangle")).toBeInTheDocument();
  });

  it("shows no warning icon for a bucket in the ok state", () => {
    render(
      <BudgetBucketCard
        summary={{
          id: "bucket-ndis",
          kind: "ndis",
          label: "NDIS",
          total: 24000,
          used: 9120,
          remaining: 14880,
          percentUsed: 38,
          state: "ok",
        }}
      />,
    );

    expect(screen.queryByTestId("icon-alert-triangle")).not.toBeInTheDocument();
  });
});
