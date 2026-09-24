import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Loading from "@/app/(family)/family/[clientId]/budget/loading";
import BudgetPage from "@/app/(family)/family/[clientId]/budget/page";
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getBudgetSummary: vi.fn(),
  getFundHistory: vi.fn(),
  getClientHeaderSummary: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
}));
vi.mock("@/server/budget/queries", () => ({
  getBudgetSummary: mocks.getBudgetSummary,
  getFundHistory: mocks.getFundHistory,
}));
vi.mock("@/server/clients/queries", () => ({
  getClientHeaderSummary: mocks.getClientHeaderSummary,
}));

/*
 * The screen reads only through the `src/server/**` contract, so these tests
 * replace that contract with data that mirrors docs/design/screens/family-06-budget.png
 * (TEST_PLAN "Test data": a test may create its own fixtures). The contract's own
 * fixtures are covered in src/server/budget/queries.test.ts.
 */
const CLIENT_ID = "client-margaret";

function bucket(
  kind: BudgetBucketSummary["kind"],
  label: string,
  total: number,
  used: number,
): BudgetBucketSummary {
  const percentUsed = total === 0 ? 0 : Math.round((used / total) * 100);
  const state: BudgetBucketSummary["state"] =
    percentUsed >= 100
      ? "exhausted"
      : percentUsed >= 85
        ? "alert"
        : percentUsed >= 75
          ? "warning"
          : "ok";
  return { kind, label, total, used, remaining: total - used, percentUsed, state };
}

const BUCKETS = [
  bucket("ndis", "NDIS", 24000, 9120),
  bucket("fixed", "Fixed", 5000, 2250),
  bucket("government", "Government", 3000, 2760),
];

function entry(
  id: string,
  bucketKind: FundEntry["bucketKind"],
  type: FundEntry["type"],
  amount: number,
  date: string,
  description?: string,
  recordedBy?: string,
): FundEntry {
  return { id, clientId: CLIENT_ID, bucketKind, type, amount, date, description, recordedBy };
}

const HISTORY = [
  entry("fund-1", "ndis", "topup", 6000, "2026-11-03", "NDIS quarterly plan top-up", "Helen Doyle"),
  entry("fund-2", "fixed", "topup", 1000, "2026-10-15", "Fixed funding top-up", "Helen Doyle"),
  entry(
    "fund-3",
    "government",
    "topup",
    750,
    "2026-10-01",
    "Government subsidy payment",
    "Helen Doyle",
  ),
];

beforeEach(() => {
  mocks.getBudgetSummary.mockResolvedValue(BUCKETS);
  mocks.getFundHistory.mockResolvedValue(HISTORY);
  mocks.getClientHeaderSummary.mockResolvedValue({
    id: CLIENT_ID,
    firstName: "Margaret",
    lastName: "Doyle",
    age: 78,
    suburb: "Preston VIC",
    organisationName: "Banksia Home Care",
  });
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

/** The page logs a tagged line when the contract rejects; keep it out of the test output. */
function captureErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

async function renderBudget() {
  const page = await BudgetPage({ params: Promise.resolve({ clientId: CLIENT_ID }) });
  return render(page);
}

function fundsCard() {
  return screen.getByRole("region", { name: "Funds by source" });
}

function historyCard() {
  return screen.getByRole("region", { name: "History" });
}

function historyTable() {
  return within(historyCard()).getByRole("table", { name: "History" });
}

/** The History's data rows, the heading row left out. */
function dataRows() {
  return within(historyTable()).getAllByRole("row").slice(1);
}

/**
 * The History's data rows as [date, description, amount]. The description cell
 * holds the description as its first element and, when the entry says who
 * recorded it, the "Recorded by …" line as its second (FD-05).
 */
function historyRows() {
  return dataRows().map((row) => {
    const [date, description, amount] = within(row).getAllByRole("cell");
    return [
      date!.textContent,
      description!.firstElementChild?.textContent ?? "",
      amount!.textContent,
    ];
  });
}

/** Each row's "Recorded by …" element, or null when the row has none. */
function historyAttributions() {
  return dataRows().map((row) => within(row).getAllByRole("cell")[1]!.children[1] ?? null);
}

describe("[FAM-UI-05] Family Budget", () => {
  it("[FAM-UI-05][AC-01] shows the NDIS $14,880, Fixed $2,750 and Government $240 cards, in that order, with their totals and percent used", async () => {
    await renderBudget();
    const cards = within(fundsCard()).getAllByRole("listitem");

    expect(cards).toHaveLength(3);
    expect(within(cards[0]!).getByText("NDIS")).toBeInTheDocument();
    expect(within(cards[0]!).getByText("$14,880")).toBeInTheDocument();
    expect(within(cards[0]!).getByText("of $24,000 · 38% used")).toBeInTheDocument();

    expect(within(cards[1]!).getByText("Fixed")).toBeInTheDocument();
    expect(within(cards[1]!).getByText("$2,750")).toBeInTheDocument();
    expect(within(cards[1]!).getByText("of $5,000 · 45% used")).toBeInTheDocument();

    expect(within(cards[2]!).getByText("Government")).toBeInTheDocument();
    expect(within(cards[2]!).getByText("$240")).toBeInTheDocument();
    expect(within(cards[2]!).getByText("of $3,000 · 92% used")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-01] each card has a progress bar named for its bucket and percent used", async () => {
    await renderBudget();

    expect(screen.getByRole("progressbar", { name: "NDIS budget, 38% used" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Fixed budget, 45% used" })).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Government budget, 92% used" }),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-01] the Government card is the only one that warns, and says so in words, not by colour alone", async () => {
    await renderBudget();
    const cards = within(fundsCard()).getAllByRole("listitem");

    expect(within(cards[2]!).getByText("Budget alert")).toBeInTheDocument();
    expect(
      within(cards[0]!).queryByText(/Budget (warning|alert|exhausted)/),
    ).not.toBeInTheDocument();
    expect(
      within(cards[1]!).queryByText(/Budget (warning|alert|exhausted)/),
    ).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][PRD] the screen is two cards, 'Funds by source' then 'History', and repeats no client name", async () => {
    await renderBudget();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Funds by source", "History"]);
    expect(screen.getAllByRole("region")).toHaveLength(2);

    // FD-08: the shell header shows the client; the body does not repeat it.
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText("Margaret")).not.toBeInTheDocument();
    expect(
      screen.queryByText("78 years · Preston VIC · Banksia Home Care"),
    ).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][PRD] 'Funds by source' has an 'Update' button", async () => {
    await renderBudget();

    const update = within(fundsCard()).getByRole("button", { name: "Update" });
    expect(update).toHaveAttribute("type", "button");
  });

  it("[FAM-UI-05][AC-02] History is a table with the columns Date, Description and Amount", async () => {
    await renderBudget();

    const headings = within(historyTable()).getAllByRole("columnheader");
    expect(headings.map((h) => h.textContent)).toEqual(["Date", "Description", "Amount"]);
  });

  it("[FAM-UI-05][AC-02] the first History row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'", async () => {
    await renderBudget();

    expect(historyRows()[0]).toEqual(["3 Nov 2026", "NDIS quarterly plan top-up", "+$6,000"]);
  });

  it("[FAM-UI-05][AC-02] shows all three rows the design draws, in the order the contract gives", async () => {
    await renderBudget();

    expect(historyRows()).toEqual([
      ["3 Nov 2026", "NDIS quarterly plan top-up", "+$6,000"],
      ["15 Oct 2026", "Fixed funding top-up", "+$1,000"],
      ["1 Oct 2026", "Government subsidy payment", "+$750"],
    ]);
  });

  it("[FAM-UI-05][PRD] keeps the order it is given: the screen does not sort the contract's history", async () => {
    mocks.getFundHistory.mockResolvedValue([HISTORY[2]!, HISTORY[0]!]);
    await renderBudget();

    expect(historyRows().map((row) => row[1])).toEqual([
      "Government subsidy payment",
      "NDIS quarterly plan top-up",
    ]);
  });
});

describe("[FAM-UI-05] History rows (PD-034: top-ups and expenses)", () => {
  it("[FAM-UI-05][PRD] an expense reads as a negative amount in the same columns", async () => {
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-4", "ndis", "expense", -320, "2026-11-15", "Physiotherapy session"),
      ...HISTORY,
    ]);
    await renderBudget();

    expect(historyRows()[0]).toEqual(["15 Nov 2026", "Physiotherapy session", "-$320"]);
    expect(historyRows()[1]).toEqual(["3 Nov 2026", "NDIS quarterly plan top-up", "+$6,000"]);
  });

  it("[FAM-UI-05][PRD] FD-05 (PD-034): each row says who recorded the entry, as 'Recorded by <name>'", async () => {
    await renderBudget();

    expect(historyAttributions().map((line) => line?.textContent)).toEqual([
      "Recorded by Helen Doyle",
      "Recorded by Helen Doyle",
      "Recorded by Helen Doyle",
    ]);
  });

  it("[FAM-UI-05][PRD] FD-05: the line sits in the description cell under the description, so the table keeps its three columns", async () => {
    await renderBudget();

    expect(within(historyTable()).getAllByRole("columnheader")).toHaveLength(3);
    for (const row of dataRows()) {
      expect(within(row).getAllByRole("cell")).toHaveLength(3);
    }
    // The description comes first, so it is read first.
    const cell = within(dataRows()[0]!).getAllByRole("cell")[1]!;
    expect(Array.from(cell.children).map((child) => child.textContent)).toEqual([
      "NDIS quarterly plan top-up",
      "Recorded by Helen Doyle",
    ]);
  });

  it("[FAM-UI-05][PRD] FD-05: an expense recorded by a carer names the carer, and reads '-$320' in the same columns", async () => {
    mocks.getFundHistory.mockResolvedValue([
      entry(
        "fund-4",
        "ndis",
        "expense",
        -320,
        "2026-11-15",
        "Physiotherapy session",
        "Aisha Rahman",
      ),
      ...HISTORY,
    ]);
    await renderBudget();

    expect(historyRows()[0]).toEqual(["15 Nov 2026", "Physiotherapy session", "-$320"]);
    expect(historyAttributions().map((line) => line?.textContent)).toEqual([
      "Recorded by Aisha Rahman",
      "Recorded by Helen Doyle",
      "Recorded by Helen Doyle",
      "Recorded by Helen Doyle",
    ]);
  });

  it("[FAM-UI-05][PRD] FD-05: an entry that does not say who recorded it has no line, not 'unknown' or an empty 'Recorded by'", async () => {
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-5", "ndis", "topup", 500, "2026-10-20", "No recorder"),
      entry("fund-6", "ndis", "topup", 400, "2026-10-19", "Blank recorder", "   "),
      entry("fund-7", "ndis", "topup", 300, "2026-10-18", "Padded recorder", "  Helen Doyle  "),
    ]);
    await renderBudget();

    expect(historyAttributions().map((line) => line?.textContent ?? null)).toEqual([
      null,
      null,
      "Recorded by Helen Doyle",
    ]);
    expect(within(historyCard()).queryByText(/unknown/i)).not.toBeInTheDocument();
    expect(historyRows().map((row) => row[1])).toEqual([
      "No recorder",
      "Blank recorder",
      "Padded recorder",
    ]);
  });

  it("[FAM-UI-05][PRD] FD-05: the recorder is named in History only, not in the bucket cards", async () => {
    await renderBudget();

    expect(within(fundsCard()).queryByText(/recorded by|Helen/i)).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][PRD] cents are kept when there are cents, and a September date says 'Sep'", async () => {
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-5", "fixed", "topup", 1234.5, "2026-09-05", "Cents top-up"),
    ]);
    await renderBudget();

    expect(historyRows()).toEqual([["5 Sep 2026", "Cents top-up", "+$1,234.50"]]);
  });

  it("[FAM-UI-05][PRD] FD-09: an entry with no description, or only spaces, reads 'No description'", async () => {
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-6", "ndis", "topup", 500, "2026-10-20"),
      entry("fund-7", "ndis", "topup", 400, "2026-10-19", "   "),
    ]);
    await renderBudget();

    expect(historyRows()).toEqual([
      ["20 Oct 2026", "No description", "+$500"],
      ["19 Oct 2026", "No description", "+$400"],
    ]);
  });

  it("[FAM-UI-05][PRD] two entries that look identical are both shown, without a duplicate-key warning", async () => {
    const log = captureErrorLog();
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-8", "ndis", "topup", 100, "2026-10-20", "Same top-up"),
      entry("fund-9", "ndis", "topup", 100, "2026-10-20", "Same top-up"),
    ]);
    await renderBudget();

    expect(historyRows()).toHaveLength(2);
    expect(log).not.toHaveBeenCalled();
  });

  it("[FAM-UI-05][PRD] shows every entry it is given, with no paging (Phase 1)", async () => {
    mocks.getFundHistory.mockResolvedValue(
      Array.from({ length: 40 }, (_, i) =>
        entry(`fund-${i}`, "ndis", "topup", 100 + i, "2026-10-20", `Top-up ${i + 1}`),
      ),
    );
    await renderBudget();

    expect(historyRows()).toHaveLength(40);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][PRD] the cards and the table each stay in their own card: no table among the buckets, no progress bar in History", async () => {
    await renderBudget();

    expect(within(fundsCard()).queryByRole("table")).not.toBeInTheDocument();
    expect(within(historyCard()).queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-05] 'Update' (FD-06: the flow is FAM-11)", () => {
  it("[FAM-UI-05][PRD] has a live region on the page from the start, so a message will be announced, and it is empty", async () => {
    await renderBudget();

    expect(within(fundsCard()).getByRole("status")).toBeEmptyDOMElement();
  });

  it("[FAM-UI-05][PRD] pressing 'Update' says updating funds is not available yet, and changes nothing", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await user.click(within(fundsCard()).getByRole("button", { name: "Update" }));

    expect(within(fundsCard()).getByRole("status")).toHaveTextContent(
      "Updating funds is not available yet.",
    );
    // No card and no History row is added or changed.
    expect(within(fundsCard()).getAllByRole("listitem")).toHaveLength(3);
    expect(within(fundsCard()).getByText("$14,880")).toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("[FAM-UI-05][PRD] can be pressed from the keyboard", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await user.tab();
    expect(within(fundsCard()).getByRole("button", { name: "Update" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(within(fundsCard()).getByRole("status")).toHaveTextContent(
      "Updating funds is not available yet.",
    );
  });
});

describe("[FAM-UI-05] states (States sheet, OQ-24 defaults, FD-07)", () => {
  it("[FAM-UI-05][AC-03] with no fund entries, History shows an empty state, and no table", async () => {
    mocks.getFundHistory.mockResolvedValue([]);
    await renderBudget();
    const card = historyCard();

    expect(within(card).getByRole("heading", { name: "History" })).toBeInTheDocument();
    expect(within(card).getByText("No fund history yet")).toBeInTheDocument();
    expect(
      within(card).getByText("Top-ups and expenses will appear here once funds are added."),
    ).toBeInTheDocument();
    expect(within(card).queryByRole("table")).not.toBeInTheDocument();
    expect(within(card).queryByRole("columnheader")).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-03] the bucket cards and 'Update' are still there when History is empty", async () => {
    mocks.getFundHistory.mockResolvedValue([]);
    await renderBudget();

    expect(within(fundsCard()).getAllByRole("listitem")).toHaveLength(3);
    expect(within(fundsCard()).getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("[FAM-UI-05][PRD] with no buckets, 'Funds by source' shows an empty state and keeps 'Update'; History is unaffected", async () => {
    mocks.getBudgetSummary.mockResolvedValue([]);
    await renderBudget();

    expect(within(fundsCard()).getByText("No funding set up yet")).toBeInTheDocument();
    expect(
      within(fundsCard()).getByText("Funding buckets will appear here once they are set up."),
    ).toBeInTheDocument();
    expect(within(fundsCard()).queryByRole("listitem")).not.toBeInTheDocument();
    expect(within(fundsCard()).getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);
  });

  it("[FAM-UI-05][PRD] with neither buckets nor entries, both cards show their own empty state", async () => {
    mocks.getBudgetSummary.mockResolvedValue([]);
    mocks.getFundHistory.mockResolvedValue([]);
    await renderBudget();

    expect(within(fundsCard()).getByText("No funding set up yet")).toBeInTheDocument();
    expect(within(historyCard()).getByText("No fund history yet")).toBeInTheDocument();
  });

  it.each([
    ["getBudgetSummary", () => mocks.getBudgetSummary.mockRejectedValue(new Error("x"))],
    ["getFundHistory", () => mocks.getFundHistory.mockRejectedValue(new Error("x"))],
  ])(
    "[FAM-UI-05][PRD] error state: shows 'Something went wrong' with Retry when %s rejects",
    async (_contractFunction, rejectIt) => {
      captureErrorLog();
      rejectIt();
      const user = userEvent.setup();
      await renderBudget();

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      // Nothing half-loaded is left on screen beside the error, and no 'Update' to press.
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Retry" }));
      expect(mocks.refresh).toHaveBeenCalledTimes(1);
    },
  );

  it("[FAM-UI-05][PRD] logs a feature-tagged line, without the error's message, when the contract rejects", async () => {
    // ARCHITECTURE.md §12.5: no PII in logs.
    const log = captureErrorLog();
    mocks.getFundHistory.mockRejectedValue(new Error("no fund rows for Margaret Doyle"));
    await renderBudget();

    expect(log).toHaveBeenCalledTimes(1);
    const logged = log.mock.calls[0]!.join(" ");
    expect(logged).toContain("[family-budget]");
    expect(logged).not.toContain("Margaret");
    expect(logged).not.toContain("fund rows");
  });

  it("[FAM-UI-05][PRD] loading state: a labelled skeleton in the screen's shape, with no data in it", async () => {
    render(<Loading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText("$14,880")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-05] the screen reads through the contract", () => {
  it("[FAM-UI-05][PRD] asks the contract for the route's client, and only that client", async () => {
    await renderBudget();

    expect(mocks.getBudgetSummary).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
    expect(mocks.getFundHistory).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
  });

  it("[FAM-UI-05][PRD] does not read the client's header summary: the shell header owns it", async () => {
    await renderBudget();

    expect(mocks.getClientHeaderSummary).not.toHaveBeenCalled();
  });
});

describe("[FAM-UI-05] long and unusual content stays inside its card (no overlap at any width)", () => {
  it("[FAM-UI-05][PRD] a long unbroken description is cut to two lines, with the whole text in the DOM and in its title", async () => {
    const unbroken = "Z".repeat(300);
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-10", "ndis", "topup", 100, "2026-10-20", unbroken),
    ]);
    await renderBudget();

    const description = within(historyTable()).getByText(unbroken);
    expect(description).toHaveAttribute("title", unbroken);
    expect(description.className).toContain("line-clamp-2");
    expect(description.className).toContain("[overflow-wrap:anywhere]");
  });

  it("[FAM-UI-05][PRD] a long spaced description and a non-ASCII one keep every character", async () => {
    const long = `${"Quarterly plan top-up from the funding body ".repeat(12)}end`;
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-11", "ndis", "topup", 100, "2026-10-20", long),
      entry("fund-12", "ndis", "topup", 100, "2026-10-19", "朝の薬 💊 — Zoë's top-up"),
    ]);
    await renderBudget();

    expect(historyRows().map((row) => row[1])).toEqual([long, "朝の薬 💊 — Zoë's top-up"]);
  });

  it("[FAM-UI-05][PRD] a long unbroken recorder name is cut to two lines, with the whole line in the DOM and in its title", async () => {
    const unbroken = "Q".repeat(300);
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-14", "ndis", "topup", 100, "2026-10-20", "Top-up", unbroken),
    ]);
    await renderBudget();

    const line = historyAttributions()[0]!;
    expect(line.textContent).toBe(`Recorded by ${unbroken}`);
    expect(line).toHaveAttribute("title", `Recorded by ${unbroken}`);
    expect(line.className).toContain("line-clamp-2");
    expect(line.className).toContain("[overflow-wrap:anywhere]");
  });

  it("[FAM-UI-05][PRD] a non-ASCII recorder name keeps every character", async () => {
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-15", "ndis", "topup", 100, "2026-10-20", "Top-up", "Zoë Ñuñez 朝子"),
    ]);
    await renderBudget();

    expect(historyAttributions()[0]!.textContent).toBe("Recorded by Zoë Ñuñez 朝子");
  });

  it("[FAM-UI-05][PRD] a very large amount keeps every digit", async () => {
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-13", "ndis", "topup", 9999999999.99, "2026-10-20", "Very large top-up"),
    ]);
    await renderBudget();

    expect(historyRows()[0]![2]).toBe("+$9,999,999,999.99");
  });

  it("[FAM-UI-05][PRD] a long bucket name is cut to two lines with the whole name in its title, and its amounts never lose digits", async () => {
    const longName = `${"Very long funding source name ".repeat(8)}end`;
    mocks.getBudgetSummary.mockResolvedValue([bucket("ndis", longName, 123456789.5, 1000)]);
    await renderBudget();

    const name = within(fundsCard()).getByText(longName);
    expect(name).toHaveAttribute("title", longName);
    expect(name.className).toContain("line-clamp-2");
    expect(within(fundsCard()).getByText("$123,455,789.50")).toBeInTheDocument();
  });

  it("[FAM-UI-05][PRD] any number of buckets is drawn, several of one kind included, without a duplicate-key warning", async () => {
    const log = captureErrorLog();
    mocks.getBudgetSummary.mockResolvedValue([
      ...BUCKETS,
      bucket("ndis", "NDIS", 1000, 100),
      bucket("ndis", "NDIS", 2000, 200),
    ]);
    await renderBudget();

    expect(within(fundsCard()).getAllByRole("listitem")).toHaveLength(5);
    expect(log).not.toHaveBeenCalled();
  });

  it("[FAM-UI-05][PRD] an overspent bucket is written out as 'over budget', not only as a bar at 100%", async () => {
    mocks.getBudgetSummary.mockResolvedValue([bucket("government", "Government", 3000, 3360)]);
    await renderBudget();

    expect(within(fundsCard()).getByText("-$360")).toBeInTheDocument();
    expect(within(fundsCard()).getByText(/over budget/)).toBeInTheDocument();
    expect(within(fundsCard()).getByText("Budget exhausted")).toBeInTheDocument();
  });
});

describe("[FAM-UI-05] accessibility", () => {
  it("[FAM-UI-05][PRD] the screen, before and after pressing 'Update', has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = await renderBudget();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(fundsCard()).getByRole("button", { name: "Update" }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-05][PRD] the loading, empty and error states have no axe violations", async () => {
    const loading = render(<Loading />);
    expect(await axe(loading.container)).toHaveNoViolations();
    loading.unmount();

    mocks.getBudgetSummary.mockResolvedValue([]);
    mocks.getFundHistory.mockResolvedValue([]);
    const empty = await renderBudget();
    expect(await axe(empty.container)).toHaveNoViolations();
    empty.unmount();

    captureErrorLog();
    mocks.getFundHistory.mockRejectedValue(new Error("x"));
    const error = await renderBudget();
    expect(await axe(error.container)).toHaveNoViolations();
  });
});
