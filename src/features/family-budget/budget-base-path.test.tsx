import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BudgetHolder } from "./budget-holder";
import { EditBudgetView } from "./edit-budget-view";
import { FamilyBudgetView } from "./family-budget-view";

import type { FamilyBudgetData } from "./budget-data";

/*
 * ADM-11 FD-02: Budget and Edit budget take an optional `basePath` so an admin stays under
 * `/admin/clients/<id>`. Without it every link is exactly the Family one (the Family suites in
 * family-budget.test.tsx and edit-budget-save.test.tsx are unchanged).
 */
const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

const CLIENT_ID = "c1";
const ADMIN_BASE = "/admin/clients/c1";

const DATA: FamilyBudgetData = {
  buckets: [
    {
      id: "bucket-ndis",
      kind: "ndis",
      label: "NDIS",
      total: 24000,
      used: 9120,
      remaining: 14880,
      percentUsed: 38,
      state: "ok",
    },
  ],
  history: [],
  today: "2026-11-30",
};

beforeEach(() => mocks.push.mockReset());

describe("[ADM-11][AC-02] Budget links stay under the base path", () => {
  it("[ADM-11][AC-02] Edit goes to <basePath>/budget/edit", () => {
    render(
      <BudgetHolder>
        <FamilyBudgetView clientId={CLIENT_ID} data={DATA} basePath={ADMIN_BASE} />
      </BudgetHolder>,
    );

    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      `${ADMIN_BASE}/budget/edit`,
    );
  });

  it("[ADM-11][AC-02] without a base path Edit is still /family/<id>/budget/edit", () => {
    render(
      <BudgetHolder>
        <FamilyBudgetView clientId={CLIENT_ID} data={DATA} />
      </BudgetHolder>,
    );

    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/family/c1/budget/edit",
    );
  });
});

describe("[ADM-11][AC-03] Edit budget returns under the base path", () => {
  it("[ADM-11][AC-03] Cancel goes back to <basePath>/budget", async () => {
    render(
      <BudgetHolder>
        <EditBudgetView clientId={CLIENT_ID} data={DATA} basePath={ADMIN_BASE} />
      </BudgetHolder>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.push).toHaveBeenCalledWith(`${ADMIN_BASE}/budget`);
  });

  it("[ADM-11][AC-03] without a base path Cancel still goes to /family/<id>/budget", async () => {
    render(
      <BudgetHolder>
        <EditBudgetView clientId={CLIENT_ID} data={DATA} />
      </BudgetHolder>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.push).toHaveBeenCalledWith("/family/c1/budget");
  });
});
