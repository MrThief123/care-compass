import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EditBudgetPage from "@/app/(family)/family/[clientId]/budget/edit/page";
import { BudgetHolder } from "@/features/family-budget/budget-holder";
import type { BudgetBucketSummary } from "@/types/domain";

/*
 * [FAM-11] The Edit budget page's Save, wired (AC-07, AC-08). With DATA_SOURCE=supabase Save calls the
 * `saveBudgetEdit` Server Action and Budget re-reads the stored figures; with DATA_SOURCE=mock the Phase 1
 * local-state behaviour is unchanged (FAM-UI-05, covered in family-budget.test.tsx). The action's own
 * rules are covered in src/server/budget/actions.test.ts and supabase/tests/budget_save_edit.test.sql.
 */
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  save: vi.fn(),
  getBudgetSummary: vi.fn(),
  getFundHistory: vi.fn(),
  getToday: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/server/budget/queries", () => ({
  getBudgetSummary: mocks.getBudgetSummary,
  getFundHistory: mocks.getFundHistory,
}));
vi.mock("@/server/events/queries", () => ({ getToday: mocks.getToday }));
vi.mock("@/server/budget/actions", () => ({ saveBudgetEdit: mocks.save }));

const CLIENT_ID = "client-margaret";
const BUDGET_HREF = `/family/${CLIENT_ID}/budget`;

function bucket(id: string, label: string, total: number, used: number): BudgetBucketSummary {
  const percentUsed = total === 0 ? 0 : Math.round((used / total) * 100);
  return { id, label, total, used, remaining: total - used, percentUsed, state: "ok" };
}

const BUCKETS = [
  bucket("bucket-ndis", "NDIS", 24000, 9120),
  bucket("bucket-government", "Government", 3000, 2760),
  bucket("bucket-gift", "Gift", 500, 0), // nothing spent: the one that can be removed
];

const GENERAL_FAILURE = "Couldn’t save the budget. Try again.";

beforeEach(() => {
  mocks.getBudgetSummary.mockResolvedValue(BUCKETS);
  mocks.getFundHistory.mockResolvedValue([]);
  mocks.getToday.mockResolvedValue("2026-11-30");
  mocks.save.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

async function renderEditBudget() {
  const page = await EditBudgetPage({ params: Promise.resolve({ clientId: CLIENT_ID }) });
  return render(<BudgetHolder>{page}</BudgetHolder>);
}

/** The panel for a saved bucket (a fieldset named after it). */
function panel(name: string) {
  return screen.getByRole("group", { name });
}

async function typeAmount(
  user: ReturnType<typeof userEvent.setup>,
  bucketName: string,
  value: string,
) {
  await user.type(within(panel(bucketName)).getByLabelText("Amount"), value);
}

describe("[FAM-11][AC-07] Edit budget saves through the action when the data source is supabase", () => {
  beforeEach(() => {
    vi.stubEnv("DATA_SOURCE", "supabase");
  });

  it("[FAM-11][AC-07] T-13 Save calls the action once with the checked edit, then goes back to Budget and refreshes it", async () => {
    const user = userEvent.setup();
    await renderEditBudget();

    await typeAmount(user, "NDIS", "1000");
    await user.type(screen.getByLabelText("Note (optional)"), "Q3 plan review");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(mocks.save).toHaveBeenCalledWith(CLIENT_ID, {
      buckets: [
        { id: "bucket-ndis", name: "NDIS", direction: "add", amount: 1000, remove: false },
        { id: "bucket-government", name: "Government", direction: "add", amount: 0, remove: false },
        { id: "bucket-gift", name: "Gift", direction: "add", amount: 0, remove: false },
      ],
      added: [],
      note: "Q3 plan review",
    });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(BUDGET_HREF));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("[FAM-11][AC-07] T-13 a new bucket and a removal go in the call as their own lists", async () => {
    const user = userEvent.setup();
    await renderEditBudget();

    await user.click(within(panel("Gift")).getByRole("button", { name: "Remove bucket" }));
    await user.click(screen.getByRole("button", { name: "Add bucket" }));
    const added = screen.getByRole("group", { name: "New bucket" });
    await user.type(within(added).getByLabelText("Name"), "Council grant");
    await user.type(within(added).getByLabelText("Starting amount"), "1200");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    const [, edit] = mocks.save.mock.calls[0]!;
    expect(edit.buckets[2]).toMatchObject({ id: "bucket-gift", remove: true });
    expect(edit.added).toEqual([{ name: "Council grant", startingAmount: 1200 }]);
  });

  it("[FAM-11][AC-07] T-13 a field refusal from the action marks that field, focuses it and stays on the page", async () => {
    mocks.save.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the marked fields.",
        fields: { "buckets.1.amount": "Only $240 available" },
      },
    });
    const user = userEvent.setup();
    await renderEditBudget();

    await user.click(within(panel("Government")).getByRole("radio", { name: "Remove" }));
    await typeAmount(user, "Government", "200");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const amount = within(panel("Government")).getByLabelText("Amount");
    await waitFor(() => expect(amount).toHaveAttribute("aria-invalid", "true"));
    expect(within(panel("Government")).getByText("Only $240 available")).toBeInTheDocument();
    expect(amount).toHaveFocus();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(amount).toHaveValue("200");
  });

  it.each([
    [
      "NOT_ALLOWED",
      "Only the client’s family or their organisation’s admins can change the budget.",
    ],
    ["UNEXPECTED", GENERAL_FAILURE],
  ])(
    "[FAM-11][AC-07] T-13 a %s failure shows its message above Save, keeps what was typed and stays on the page",
    async (code, message) => {
      mocks.save.mockResolvedValue({ ok: false, error: { code, message } });
      const user = userEvent.setup();
      await renderEditBudget();

      await typeAmount(user, "NDIS", "1000");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(within(panel("NDIS")).getByLabelText("Amount")).toHaveValue("1000");
      expect(mocks.push).not.toHaveBeenCalled();
    },
  );

  it("[FAM-11][AC-07] T-13 a save that changes nothing calls no action and just goes back to Budget", async () => {
    const user = userEvent.setup();
    await renderEditBudget();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith(BUDGET_HREF);
  });

  it("[FAM-11][AC-07] T-13 a save the page refuses never reaches the action", async () => {
    const user = userEvent.setup();
    await renderEditBudget();

    await typeAmount(user, "NDIS", "-50");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mocks.save).not.toHaveBeenCalled();
    expect(within(panel("NDIS")).getByLabelText("Amount")).toHaveAttribute("aria-invalid", "true");
  });

  it("[FAM-11][AC-07] T-13 Save cannot be pressed twice while the action is running", async () => {
    let finish!: (result: unknown) => void;
    mocks.save.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    await renderEditBudget();

    await typeAmount(user, "NDIS", "1000");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: /Save/ }));

    expect(mocks.save).toHaveBeenCalledTimes(1);
    finish({ ok: true, data: undefined });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(BUDGET_HREF));
  });
});

describe("[FAM-11][AC-08] Edit budget is unchanged when the data source is mock", () => {
  it("[FAM-11][AC-08] T-14 Save calls no action and goes back to Budget", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const user = userEvent.setup();
    await renderEditBudget();

    await typeAmount(user, "NDIS", "500");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith(BUDGET_HREF);
  });
});
