import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useEffect, useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

import EditLoading from "@/app/(family)/family/[clientId]/budget/edit/loading";
import EditBudgetPage from "@/app/(family)/family/[clientId]/budget/edit/page";
import BudgetLayout from "@/app/(family)/family/[clientId]/budget/layout";
import Loading from "@/app/(family)/family/[clientId]/budget/loading";
import BudgetPage from "@/app/(family)/family/[clientId]/budget/page";
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  getBudgetSummary: vi.fn(),
  getFundHistory: vi.fn(),
  getClientHeaderSummary: vi.fn(),
  getToday: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/server/budget/queries", () => ({
  getBudgetSummary: mocks.getBudgetSummary,
  getFundHistory: mocks.getFundHistory,
}));
// The reference day a saved edit is dated (CHG-020, CHG-021); the mock answers Mon 30 Nov 2026.
vi.mock("@/server/events/queries", () => ({
  getToday: mocks.getToday,
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
const BUDGET_HREF = `/family/${CLIENT_ID}/budget`;
const EDIT_HREF = `${BUDGET_HREF}/edit`;

let bucketSeq = 0;

/** A bucket (CHG-021: a stable `id`, a free name in `label`, `kind` only when made from a suggestion). */
function bucket(
  kind: BudgetBucketSummary["kind"],
  label: string,
  total: number,
  used: number,
  id = `bucket-test-${++bucketSeq}`,
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
  return { id, kind, label, total, used, remaining: total - used, percentUsed, state };
}

const BUCKETS = [
  bucket("ndis", "NDIS", 24000, 9120, "bucket-ndis"),
  bucket("fixed", "Fixed", 5000, 2250, "bucket-fixed"),
  bucket("government", "Government", 3000, 2760, "bucket-government"),
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
  return {
    id,
    clientId: CLIENT_ID,
    bucketId: `bucket-${bucketKind}`,
    bucketKind,
    type,
    amount,
    date,
    description,
    recordedBy,
  };
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

/** A cost a bucket could not cover when its occurrence was completed (CHG-020, PD-058). */
function pendingCost(id: string, amount: number, date: string, description: string): FundEntry {
  return {
    id,
    clientId: CLIENT_ID,
    bucketId: "bucket-government",
    bucketKind: "government",
    type: "expense",
    amount: -amount,
    date,
    description,
    recordedBy: "Aisha Rahman",
    pending: true,
  };
}

/** Government holding one pending cost of $310, which is more than its $240. */
const BUCKETS_WITH_PENDING = [
  BUCKETS[0]!,
  BUCKETS[1]!,
  { ...BUCKETS[2]!, pendingTotal: 310, pendingCount: 1 },
];

const HISTORY_WITH_PENDING = [
  HISTORY[0]!,
  pendingCost("pending-1", 310, "2026-10-27", "Physiotherapy"),
  HISTORY[1]!,
  HISTORY[2]!,
];

beforeEach(() => {
  mocks.getBudgetSummary.mockResolvedValue(BUCKETS);
  mocks.getFundHistory.mockResolvedValue(HISTORY);
  mocks.getToday.mockResolvedValue("2026-11-30");
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

/*
 * The budget route as the App Router runs it (CHG-021): `budget/layout.tsx` stays
 * mounted while its page changes between Budget and Edit budget, so what a save
 * holds survives the trip back to Budget, and a reload (unmount, render again)
 * drops it. `Slot` stands in for the router's page slot under the layout.
 */
let showPage: ((page: ReactNode) => void) | undefined;

function Slot({ first }: { first: ReactNode }) {
  const [page, setPage] = useState(first);
  useEffect(() => {
    showPage = setPage;
  }, []);
  return <>{page}</>;
}

/** The page the route draws for `href`: Budget or Edit budget, for any client. */
async function pageFor(href: string) {
  const match = /^\/family\/([^/]+)\/budget(\/edit)?$/.exec(href);
  if (!match) throw new Error(`no budget route for ${href}`);
  const params = Promise.resolve({ clientId: match[1]! });
  return match[2] ? await EditBudgetPage({ params }) : await BudgetPage({ params });
}

async function renderRoute(href: string) {
  const clientId = /^\/family\/([^/]+)\//.exec(href)![1]!;
  const first = await pageFor(href);
  const layout = await BudgetLayout({
    children: <Slot first={first} />,
    params: Promise.resolve({ clientId }),
  });
  return render(layout);
}

async function renderBudget() {
  return renderRoute(BUDGET_HREF);
}

/** A client-side navigation: the layout stays, the page changes. */
async function goTo(href: string) {
  const page = await pageFor(href);
  await act(async () => showPage!(page));
}

/** Follows the last `router.push` the page made. */
async function followPush() {
  const href = mocks.push.mock.lastCall?.[0];
  if (typeof href !== "string") throw new Error("the page did not push a route");
  await goTo(href);
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

/** The bucket card whose name is `label`. */
function bucketCard(label: string) {
  const card = within(fundsCard())
    .getAllByRole("listitem")
    .find((item) => within(item).queryByText(label, { exact: true }));
  if (!card) throw new Error(`no bucket card named ${label}`);
  return card;
}

type User = ReturnType<typeof userEvent.setup>;

function status() {
  return within(fundsCard()).getByRole("status");
}

/** Budget's 'Edit' link, which leads to the Edit budget page (PD-059). */
function editLink() {
  return within(fundsCard()).getByRole("link", { name: "Edit" });
}

/** Opens Edit budget from Budget, as pressing 'Edit' does. */
async function openEdit() {
  expect(editLink()).toHaveAttribute("href", EDIT_HREF);
  await goTo(EDIT_HREF);
  return editForm();
}

function editForm() {
  return screen.getByRole("form", { name: "Edit budget" });
}

/** A saved bucket's panel on Edit budget, named by its saved name. */
function panel(name: string) {
  return within(editForm()).getByRole("group", { name });
}

/** The panels for new buckets, in the order they were added. */
function newPanels() {
  return within(editForm()).queryAllByRole("group", { name: "New bucket" });
}

function lastNewPanel() {
  const panels = newPanels();
  if (panels.length === 0) throw new Error("no new bucket");
  return panels[panels.length - 1]!;
}

/** Adds or removes funds on a saved bucket; the Change is left at Add unless it says Remove. */
async function changeFunds(
  user: User,
  bucketName: string,
  change: "Add" | "Remove",
  amount: string,
) {
  const group = panel(bucketName);
  if (change === "Remove") await user.click(within(group).getByRole("radio", { name: "Remove" }));
  await user.type(within(group).getByLabelText("Amount"), amount);
}

async function rename(user: User, bucketName: string, name: string) {
  const field = within(panel(bucketName)).getByLabelText("Name");
  await user.clear(field);
  if (name) await user.type(field, name);
}

/** Presses 'Add bucket' and fills the new bucket's name and starting amount. */
async function addBucket(user: User, name: string, startingAmount: string) {
  await user.click(within(editForm()).getByRole("button", { name: "Add bucket" }));
  const group = lastNewPanel();
  if (name) await user.type(within(group).getByLabelText("Name"), name);
  if (startingAmount)
    await user.type(within(group).getByLabelText("Starting amount"), startingAmount);
}

async function writeNote(user: User, note: string) {
  await user.type(within(editForm()).getByLabelText("Note (optional)"), note);
}

async function save(user: User) {
  await user.click(within(editForm()).getByRole("button", { name: "Save" }));
}

/** Saves, checks the page went back to Budget, and follows it there. */
async function saveAndReturn(user: User) {
  await save(user);
  expect(mocks.push).toHaveBeenLastCalledWith(BUDGET_HREF);
  await followPush();
}

/** Opens Edit budget from Budget, makes the change, saves and returns to Budget. */
async function editAndSave(user: User, change: () => Promise<void>) {
  await openEdit();
  await change();
  await saveAndReturn(user);
}

/** Escapes a string for use inside a RegExp. */
function literal(text: string) {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

/* CHG-022 (PD-060): the Pending costs section, entry details and Export. */

function pendingCard() {
  return screen.getByRole("region", { name: "Pending costs" });
}

function pendingTable() {
  return within(pendingCard()).getByRole("table", { name: "Pending costs" });
}

/** The Pending costs rows as [date, bucket, description, amount], the heading row left out. */
function pendingRows() {
  return within(pendingTable())
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    );
}

/** The data row of `table` whose details button is named `description`. */
function rowIn(table: HTMLElement, description: string) {
  const row = within(table)
    .getAllByRole("row")
    .slice(1)
    .find((candidate) => within(candidate).queryByRole("button", { name: description }));
  if (!row) throw new Error(`no row for ${description}`);
  return row;
}

/** A row's one control: the button that opens its details, named by its description. */
function detailsButton(row: HTMLElement) {
  return within(row).getByRole("button");
}

function detailsDialog(title: string) {
  return screen.getByRole("dialog", { name: title });
}

/** The dialog's details as { term: value }, in a description list. */
function detailsOf(dialog: HTMLElement) {
  return Object.fromEntries(
    within(dialog)
      .getAllByRole("term")
      .map((term) => [term.textContent, term.nextElementSibling?.textContent]),
  );
}

function exportButton() {
  return within(historyCard()).getByRole("button", { name: "Export" });
}

/**
 * Catches what Export downloads. jsdom has no object URLs and does not follow a
 * download link, so both are stood in for: each Blob handed to
 * `URL.createObjectURL`, and the name and href of each link clicked.
 */
function captureDownloads() {
  const blobs: Blob[] = [];
  const clicks: { download: string; href: string }[] = [];
  const revoked: string[] = [];
  const original = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };
  onTestFinished(() => {
    Object.assign(URL, original);
  });
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      blobs.push(blob);
      return `blob:budget-export-${blobs.length}`;
    },
    revokeObjectURL: (url: string) => {
      revoked.push(url);
    },
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicks.push({ download: this.download, href: this.getAttribute("href") ?? "" });
  });
  return { blobs, clicks, revoked };
}

/** A Blob's bytes as text, a byte-order mark kept (jsdom's Blob has no `text()`). */
function readBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(new TextDecoder("utf-8", { ignoreBOM: true }).decode(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/** The exported file's lines: the byte-order mark and final line break checked, then left out. */
async function exportedLines(blob: Blob) {
  const text = await readBlob(blob);
  expect(text.startsWith("﻿")).toBe(true);
  expect(text.endsWith("\r\n")).toBe(true);
  return text.slice(1, -2).split("\r\n");
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

  it("[FAM-UI-05][AC-13] the screen is three cards, 'Funds by source', 'Pending costs' then 'History', and repeats no client name", async () => {
    await renderBudget();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    // CHG-022 (PD-060): Pending costs sits between the bucket cards and History.
    expect(headings).toEqual(["Funds by source", "Pending costs", "History"]);
    expect(screen.getAllByRole("region")).toHaveLength(3);

    // FD-08: the shell header shows the client; the body does not repeat it.
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText("Margaret")).not.toBeInTheDocument();
    expect(
      screen.queryByText("78 years · Preston VIC · Banksia Home Care"),
    ).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-04] 'Funds by source' has an 'Edit' link to the Edit budget page, and no 'Update'", async () => {
    await renderBudget();

    expect(editLink()).toHaveAttribute("href", EDIT_HREF);
    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
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

/** A bucket with nothing spent, so it can be removed (CHG-021); its name is free text with no kind. */
const COUNCIL_GRANT = bucket(undefined, "Council grant", 1200, 0, "bucket-council");

describe("[FAM-UI-05] 'Edit' opens the Edit budget page (CHG-021, FD-12)", () => {
  it("[FAM-UI-05][PRD] Budget has a live region from the start, so a message will be announced, and it is empty", async () => {
    await renderBudget();

    expect(status()).toBeEmptyDOMElement();
  });

  it("[FAM-UI-05][AC-04] Edit budget is its own page: a heading, one form, and none of Budget's cards", async () => {
    await renderBudget();
    await openEdit();

    expect(screen.getByRole("heading", { level: 1, name: "Edit budget" })).toBeInTheDocument();
    expect(screen.getAllByRole("form")).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "Funds by source" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-04] has one panel per bucket, in Budget's order, each with its name, what remains, Add or Remove and a blank amount", async () => {
    await renderBudget();
    const form = await openEdit();

    const panels = within(form)
      .getAllByRole("group")
      .filter((group) => group.tagName === "FIELDSET");
    expect(panels.map((group) => group.querySelector("legend")?.textContent)).toEqual([
      "NDIS",
      "Fixed",
      "Government",
    ]);

    const ndis = panel("NDIS");
    expect(within(ndis).getByLabelText("Name")).toHaveValue("NDIS");
    expect(within(ndis).getByText("$14,880 remaining")).toBeInTheDocument();
    const change = within(ndis).getByRole("radiogroup", { name: "Change" });
    expect(within(change).getByRole("radio", { name: "Add" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(within(change).getByRole("radio", { name: "Remove" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(within(ndis).getByLabelText("Amount")).toHaveValue("");

    expect(within(panel("Fixed")).getByText("$2,750 remaining")).toBeInTheDocument();
    expect(within(panel("Government")).getByText("$240 remaining")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-04] has one optional note for the whole save, 'Add bucket', Save and Cancel, and no date field", async () => {
    await renderBudget();
    const form = await openEdit();

    expect(within(form).getAllByLabelText("Note (optional)")).toHaveLength(1);
    expect(within(form).getByLabelText("Note (optional)")).toHaveValue("");
    expect(within(form).getByRole("button", { name: "Add bucket" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(within(form).getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
    expect(within(form).getByRole("button", { name: "Cancel" })).toHaveAttribute("type", "button");
    // A save is dated today (PD-058).
    expect(within(form).queryByLabelText(/date/i)).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-04] adding $500 to NDIS with no note: back on Budget, NDIS shows $15,380 and History's first row is today, 'Funds added', '+$500'", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "NDIS", "Add", "500"));

    expect(within(bucketCard("NDIS")).getByText("$15,380")).toBeInTheDocument();
    expect(within(bucketCard("NDIS")).getByText("of $24,500 · 37% used")).toBeInTheDocument();
    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Funds added", "+$500"]);
    expect(historyRows()).toHaveLength(4);
    // The other cards are unchanged.
    expect(within(bucketCard("Fixed")).getByText("$2,750")).toBeInTheDocument();
    expect(within(bucketCard("Government")).getByText("$240")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-04] a save that changes something is announced on Budget as 'Budget updated.'", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "NDIS", "Add", "500"));

    await waitFor(() => expect(status()).toHaveTextContent("Budget updated."));
  });

  it("[FAM-UI-05][AC-04] the note becomes the funds row's description", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await changeFunds(user, "Fixed", "Add", "120.50");
      await writeNote(user, "Birthday money from Tom");
    });

    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Birthday money from Tom", "+$120.50"]);
  });

  it("[FAM-UI-05][AC-04] several changes in one save each make a row, in the page's order, newest first above the old rows", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await changeFunds(user, "Government", "Remove", "40");
      await changeFunds(user, "NDIS", "Add", "100");
      await writeNote(user, "Plan review");
    });

    expect(historyRows().slice(0, 3)).toEqual([
      ["30 Nov 2026", "Plan review", "+$100"],
      ["30 Nov 2026", "Plan review", "-$40"],
      ["3 Nov 2026", "NDIS quarterly plan top-up", "+$6,000"],
    ]);
    expect(historyRows()).toHaveLength(5);
  });

  it("[FAM-UI-05][AC-16] a row made on Edit budget says 'Recorded by you' (stated, not empty; no signed-in user in Phase 1)", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "NDIS", "Add", "500"));

    expect(historyAttributions()[0]).toHaveTextContent("Recorded by you");
  });

  it("[FAM-UI-05][AC-04] a save with nothing changed goes back to Budget with no new row and nothing announced", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {});

    expect(historyRows()).toHaveLength(3);
    expect(within(bucketCard("NDIS")).getByText("$14,880")).toBeInTheDocument();
    expect(status()).toBeEmptyDOMElement();
  });

  it("[FAM-UI-05][AC-04] Edit budget opened again shows the saved figures", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await editAndSave(user, () => changeFunds(user, "NDIS", "Add", "500"));

    await openEdit();

    expect(within(panel("NDIS")).getByText("$15,380 remaining")).toBeInTheDocument();
    expect(within(panel("NDIS")).getByLabelText("Amount")).toHaveValue("");
    expect(within(editForm()).getByLabelText("Note (optional)")).toHaveValue("");
  });

  it("[FAM-UI-05][AC-04] local state only: nothing is refreshed, and a reload shows the fixtures again", async () => {
    const user = userEvent.setup();
    const first = await renderBudget();
    await editAndSave(user, () => changeFunds(user, "NDIS", "Add", "500"));

    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(within(bucketCard("NDIS")).getByText("$15,380")).toBeInTheDocument();

    first.unmount();
    await renderBudget();

    expect(within(bucketCard("NDIS")).getByText("$14,880")).toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);
    expect(status()).toBeEmptyDOMElement();
  });

  it("[FAM-UI-05][AC-04] what a save holds is for that client only: another client's Budget shows its own figures", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await editAndSave(user, () => changeFunds(user, "NDIS", "Add", "500"));

    await goTo("/family/client-robert/budget");

    expect(mocks.getBudgetSummary).toHaveBeenLastCalledWith("client-robert");
    expect(within(bucketCard("NDIS")).getByText("$14,880")).toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);

    await goTo(BUDGET_HREF);

    expect(within(bucketCard("NDIS")).getByText("$15,380")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-14] adding $500 to Government pays its $310 pending cost: $430 left, and no pending line or label (CHG-022)", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "Government", "Add", "500"));

    expect(within(bucketCard("Government")).getByText("$430")).toBeInTheDocument();
    expect(within(bucketCard("Government")).queryByText(/Pending/)).not.toBeInTheDocument();
    expect(within(historyTable()).queryByText("Pending")).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-05] removing funds on Edit budget (CHG-021, AC-05)", () => {
  it("[FAM-UI-05][AC-05] removing $40 from Government: Government shows $200 and History's first row reads 'Funds removed', '-$40'", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "Government", "Remove", "40"));

    expect(within(bucketCard("Government")).getByText("$200")).toBeInTheDocument();
    expect(within(bucketCard("Government")).getByText("of $2,960 · 93% used")).toBeInTheDocument();
    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Funds removed", "-$40"]);
    await waitFor(() => expect(status()).toHaveTextContent("Budget updated."));
  });

  it("[FAM-UI-05][AC-05] removing $300 from Government says 'Only $240 available' on that amount; the page stays and nothing changes", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await changeFunds(user, "Government", "Remove", "300");
    await save(user);

    const amount = within(panel("Government")).getByLabelText("Amount");
    expect(amount).toHaveAccessibleDescription(/Only \$240 available/);
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveFocus();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(editForm()).toBeInTheDocument();

    await user.click(within(editForm()).getByRole("button", { name: "Cancel" }));
    await followPush();

    expect(within(bucketCard("Government")).getByText("$240")).toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);
  });

  it("[FAM-UI-05][AC-05] the limit follows the saved balance: after removing $40, $300 is refused as 'Only $200 available'", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await editAndSave(user, () => changeFunds(user, "Government", "Remove", "40"));

    await openEdit();
    await changeFunds(user, "Government", "Remove", "300");
    await save(user);

    expect(within(panel("Government")).getByLabelText("Amount")).toHaveAccessibleDescription(
      /Only \$200 available/,
    );
  });

  it("[FAM-UI-05][AC-05] the whole balance can be removed, leaving $0", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "Government", "Remove", "240"));

    expect(within(bucketCard("Government")).getByText("$0")).toBeInTheDocument();
    expect(within(bucketCard("Government")).getByText("Budget exhausted")).toBeInTheDocument();
  });
});

describe("[FAM-UI-05] Edit budget refuses what it cannot save (CHG-021, AC-06)", () => {
  it.each([
    ["'0'", "0", "Enter an amount more than $0."],
    ["'-5'", "-5", "Enter an amount more than $0."],
    ["'12.345'", "12.345", "Use no more than 2 decimal places."],
    ["'abc'", "abc", "Enter an amount in dollars, like 250 or 250.50."],
    ["'10000000000'", "10000000000", "Enter an amount under $10,000,000,000."],
  ])(
    "[FAM-UI-05][AC-06] an amount of %s is refused with a message on that amount, and nothing is saved",
    async (_case, amount, message) => {
      const user = userEvent.setup();
      await renderBudget();
      await openEdit();

      await changeFunds(user, "NDIS", "Add", amount);
      await save(user);

      const field = within(panel("NDIS")).getByLabelText("Amount");
      expect(field).toHaveAccessibleDescription(literal(message));
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(mocks.push).not.toHaveBeenCalled();
      expect(editForm()).toBeInTheDocument();
    },
  );

  it("[FAM-UI-05][AC-06] a blank amount is no change, not an error", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await save(user);

    expect(within(panel("NDIS")).getByLabelText("Amount")).not.toHaveAttribute("aria-invalid");
    expect(mocks.push).toHaveBeenCalledWith(BUDGET_HREF);
  });

  it.each([
    ["empty", "", "Enter a name."],
    ["only spaces", "   ", "Enter a name."],
    ["41 characters", "N".repeat(41), "Use 40 characters or fewer."],
    [
      "the same as another bucket's, ignoring case",
      "ndis",
      "Another bucket already has this name.",
    ],
    ["another's with spaces around it", "  Government ", "Another bucket already has this name."],
  ])(
    "[FAM-UI-05][AC-06] a name that is %s is refused with a message on that name, and nothing is saved",
    async (_case, name, message) => {
      const user = userEvent.setup();
      await renderBudget();
      await openEdit();

      await rename(user, "Fixed", name);
      await save(user);

      const field = within(panel("Fixed")).getByLabelText("Name");
      expect(field).toHaveAccessibleDescription(literal(message));
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(mocks.push).not.toHaveBeenCalled();
    },
  );

  it("[FAM-UI-05][AC-06] a duplicate name is marked on the bucket being renamed, not on the one that already had it", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await rename(user, "Fixed", "NDIS");
    await save(user);

    expect(within(panel("Fixed")).getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(within(panel("NDIS")).getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
  });

  it("[FAM-UI-05][AC-06] a name of exactly 40 characters, spaces around it trimmed, is accepted", async () => {
    const user = userEvent.setup();
    await renderBudget();
    const forty = "F".repeat(40);

    await editAndSave(user, () => rename(user, "Fixed", `  ${forty}  `));

    expect(within(fundsCard()).getByText(forty)).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-06] a new bucket named like a saved one is refused on the new bucket's name", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await addBucket(user, "government", "100");
    await save(user);

    const field = within(lastNewPanel()).getByLabelText("Name");
    expect(field).toHaveAccessibleDescription(/Another bucket already has this name\./);
    expect(within(panel("Government")).getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-05][AC-06] a bucket being removed frees its name for a new bucket", async () => {
    mocks.getBudgetSummary.mockResolvedValue([...BUCKETS, COUNCIL_GRANT]);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await user.click(
        within(panel("Council grant")).getByRole("button", { name: "Remove bucket" }),
      );
      await addBucket(user, "Council grant", "500");
    });

    const councilCards = within(fundsCard())
      .getAllByRole("listitem")
      .filter((card) => within(card).queryByText("Council grant", { exact: true }));
    expect(councilCards).toHaveLength(1);
    expect(within(councilCards[0]!).getByText("$500")).toBeInTheDocument();
    expect(historyRows().slice(0, 2)).toEqual([
      ["30 Nov 2026", "Bucket removed", "-$1,200"],
      ["30 Nov 2026", "Bucket added", "+$500"],
    ]);
  });

  it.each([
    ["no starting amount", "", "Enter a starting amount, or 0."],
    ["a negative one", "-5", "Enter an amount of $0 or more."],
    ["one with 3 decimal places", "12.345", "Use no more than 2 decimal places."],
    ["one that is not a number", "abc", "Enter an amount in dollars, like 250 or 250.50."],
  ])(
    "[FAM-UI-05][AC-06] a new bucket with %s is refused with a message on its starting amount",
    async (_case, startingAmount, message) => {
      const user = userEvent.setup();
      await renderBudget();
      await openEdit();

      await addBucket(user, "Council grant", startingAmount);
      await save(user);

      const field = within(lastNewPanel()).getByLabelText("Starting amount");
      expect(field).toHaveAccessibleDescription(literal(message));
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(mocks.push).not.toHaveBeenCalled();
    },
  );

  it("[FAM-UI-05][AC-06] every field in error gets its own message, and focus goes to the first in page order", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await rename(user, "Government", "");
    await changeFunds(user, "NDIS", "Add", "0");
    await addBucket(user, "", "100");
    await save(user);

    const ndisAmount = within(panel("NDIS")).getByLabelText("Amount");
    expect(ndisAmount).toHaveAttribute("aria-invalid", "true");
    expect(within(panel("Government")).getByLabelText("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(within(lastNewPanel()).getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(within(panel("Fixed")).getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
    expect(ndisAmount).toHaveFocus();
  });

  it("[FAM-UI-05][AC-06] once fixed, the same page saves and the messages go", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();
    await changeFunds(user, "NDIS", "Add", "12.345");
    await save(user);

    const amount = within(panel("NDIS")).getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "12.34");
    await saveAndReturn(user);

    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Funds added", "+$12.34"]);
  });

  it("[FAM-UI-05][AC-06] Cancel goes back to Budget with nothing changed and nothing announced", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();
    await changeFunds(user, "NDIS", "Add", "500");
    await rename(user, "Fixed", "Fixed support");
    await addBucket(user, "Council grant", "1200");

    await user.click(within(editForm()).getByRole("button", { name: "Cancel" }));
    expect(mocks.push).toHaveBeenLastCalledWith(BUDGET_HREF);
    await followPush();

    expect(within(bucketCard("NDIS")).getByText("$14,880")).toBeInTheDocument();
    expect(within(fundsCard()).getByText("Fixed")).toBeInTheDocument();
    expect(within(fundsCard()).getAllByRole("listitem")).toHaveLength(3);
    expect(historyRows()).toHaveLength(3);
    expect(status()).toBeEmptyDOMElement();
  });

  it("[FAM-UI-05][AC-06] Escape does what Cancel does", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();
    await changeFunds(user, "NDIS", "Add", "500");

    await user.keyboard("{Escape}");
    expect(mocks.push).toHaveBeenLastCalledWith(BUDGET_HREF);
    await followPush();

    expect(within(bucketCard("NDIS")).getByText("$14,880")).toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);
  });
});

describe("[FAM-UI-05] adding a bucket (CHG-021, AC-09)", () => {
  it("[FAM-UI-05][AC-09] 'Council grant' starting at 1200: Budget shows it as a fourth card with $1,200, and History's first row is 'Bucket added', '+$1,200'", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => addBucket(user, "Council grant", "1200"));

    const cards = within(fundsCard()).getAllByRole("listitem");
    expect(cards).toHaveLength(4);
    expect(within(cards[3]!).getByText("Council grant")).toBeInTheDocument();
    expect(within(cards[3]!).getByText("$1,200")).toBeInTheDocument();
    expect(within(cards[3]!).getByText("of $1,200 · 0% used")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Council grant budget, 0% used" }),
    ).toBeInTheDocument();
    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Bucket added", "+$1,200"]);
    await waitFor(() => expect(status()).toHaveTextContent("Budget updated."));
  });

  it("[FAM-UI-05][AC-09] 'Add bucket' adds a 'New bucket' panel with a name and a starting amount, and moves focus to its name", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    expect(newPanels()).toHaveLength(0);
    await user.click(within(editForm()).getByRole("button", { name: "Add bucket" }));

    const group = lastNewPanel();
    expect(within(group).getByLabelText("Name")).toHaveValue("");
    expect(within(group).getByLabelText("Starting amount")).toHaveValue("");
    expect(within(group).getByLabelText("Name")).toHaveFocus();
    // A new bucket has nothing to remove funds from.
    expect(within(group).queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-09] a new bucket can be discarded before saving, and nothing is added", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await addBucket(user, "Council grant", "1200");
      await user.click(within(lastNewPanel()).getByRole("button", { name: "Discard new bucket" }));
      expect(newPanels()).toHaveLength(0);
    });

    expect(within(fundsCard()).getAllByRole("listitem")).toHaveLength(3);
    expect(historyRows()).toHaveLength(3);
  });

  it("[FAM-UI-05][AC-09] two new buckets are both added, in the order they were added, after the saved ones", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await addBucket(user, "Council grant", "1200");
      await addBucket(user, "Family gift", "300");
    });

    const names = within(fundsCard())
      .getAllByRole("listitem")
      .map((card) => within(card).getByRole("progressbar").getAttribute("aria-label"));
    expect(names).toEqual([
      "NDIS budget, 38% used",
      "Fixed budget, 45% used",
      "Government budget, 92% used",
      "Council grant budget, 0% used",
      "Family gift budget, 0% used",
    ]);
    expect(historyRows().slice(0, 2)).toEqual([
      ["30 Nov 2026", "Bucket added", "+$1,200"],
      ["30 Nov 2026", "Bucket added", "+$300"],
    ]);
  });

  it("[FAM-UI-05][AC-09] the note does not replace 'Bucket added'", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await addBucket(user, "Council grant", "1200");
      await writeNote(user, "From the council");
    });

    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Bucket added", "+$1,200"]);
  });

  it("[FAM-UI-05][AC-09] a new bucket's figures can then be changed on Edit budget like any other", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await editAndSave(user, () => addBucket(user, "Council grant", "1200"));

    await editAndSave(user, () => changeFunds(user, "Council grant", "Add", "300"));

    expect(within(bucketCard("Council grant")).getByText("$1,500")).toBeInTheDocument();
    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Funds added", "+$300"]);
  });

  it("[FAM-UI-05][AC-09] a client with NDIS, Fixed and Government already is offered no name suggestions", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await user.click(within(editForm()).getByRole("button", { name: "Add bucket" }));

    expect(
      within(lastNewPanel()).queryByRole("group", { name: "Suggested names" }),
    ).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-05] renaming a bucket (CHG-021, AC-10)", () => {
  it("[FAM-UI-05][AC-10] 'Fixed' renamed 'Fixed support': the card keeps its place and figures, and no History row is added", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => rename(user, "Fixed", "Fixed support"));

    const cards = within(fundsCard()).getAllByRole("listitem");
    expect(within(cards[1]!).getByText("Fixed support")).toBeInTheDocument();
    expect(within(cards[1]!).getByText("$2,750")).toBeInTheDocument();
    expect(within(cards[1]!).getByText("of $5,000 · 45% used")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Fixed support budget, 45% used" }),
    ).toBeInTheDocument();
    expect(within(fundsCard()).queryByText("Fixed", { exact: true })).not.toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);
    await waitFor(() => expect(status()).toHaveTextContent("Budget updated."));
  });

  it("[FAM-UI-05][AC-10] a panel keeps its saved name as its label while the name is being changed", async () => {
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await rename(user, "Fixed", "Fixed support");

    expect(within(panel("Fixed")).getByLabelText("Name")).toHaveValue("Fixed support");
  });

  it("[FAM-UI-05][AC-10] a name changed only in case or by spaces around it is still a rename of the same bucket, not a duplicate", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => rename(user, "Fixed", "FIXED"));

    expect(within(fundsCard()).getByText("FIXED")).toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);
  });

  it("[FAM-UI-05][AC-10] a rename and a funds change in one save make one row, for the funds", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await rename(user, "Fixed", "Fixed support");
      await changeFunds(user, "Fixed", "Add", "250");
    });

    expect(within(bucketCard("Fixed support")).getByText("$3,000")).toBeInTheDocument();
    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Funds added", "+$250"]);
    expect(historyRows()).toHaveLength(4);
  });

  it("[FAM-UI-05][AC-10] a rename keeps the bucket's pending costs", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => rename(user, "Government", "Government subsidy"));

    expect(
      within(bucketCard("Government subsidy")).getByText("Pending $310 · 1 cost"),
    ).toBeInTheDocument();
  });
});

describe("[FAM-UI-05] removing a bucket (CHG-021, AC-11)", () => {
  it("[FAM-UI-05][AC-11] 'Council grant', added with $1,200, can be removed: its card goes and History's first row is 'Bucket removed', '-$1,200'", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const user = userEvent.setup();
    await renderBudget();
    await editAndSave(user, () => addBucket(user, "Council grant", "1200"));

    await editAndSave(user, () =>
      user.click(within(panel("Council grant")).getByRole("button", { name: "Remove bucket" })),
    );

    expect(within(fundsCard()).getAllByRole("listitem")).toHaveLength(3);
    expect(within(fundsCard()).queryByText("Council grant")).not.toBeInTheDocument();
    expect(historyRows().slice(0, 2)).toEqual([
      ["30 Nov 2026", "Bucket removed", "-$1,200"],
      ["30 Nov 2026", "Bucket added", "+$1,200"],
    ]);
    await waitFor(() => expect(status()).toHaveTextContent("Budget updated."));
  });

  it("[FAM-UI-05][AC-11] a bucket with money spent or pending has no 'Remove bucket', and says why in words", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    await renderBudget();
    await openEdit();

    for (const name of ["NDIS", "Fixed", "Government"]) {
      expect(
        within(panel(name)).queryByRole("button", { name: "Remove bucket" }),
      ).not.toBeInTheDocument();
    }
    expect(within(panel("NDIS")).getByText(/spent from this bucket/)).toBeInTheDocument();
    expect(within(panel("NDIS")).getByText(/can’t be removed/)).toBeInTheDocument();
    expect(within(panel("Fixed")).getByText(/spent from this bucket/)).toBeInTheDocument();
    // Government has both; the pending costs are the reason given.
    expect(within(panel("Government")).getByText(/pending costs/)).toBeInTheDocument();
    expect(
      within(panel("Government")).queryByText(/spent from this bucket/),
    ).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-11] a bucket with nothing spent but a pending cost cannot be removed either", async () => {
    mocks.getBudgetSummary.mockResolvedValue([
      { ...COUNCIL_GRANT, pendingTotal: 50, pendingCount: 1 },
    ]);
    await renderBudget();
    await openEdit();

    expect(
      within(panel("Council grant")).queryByRole("button", { name: "Remove bucket" }),
    ).not.toBeInTheDocument();
    expect(within(panel("Council grant")).getByText(/pending costs/)).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-11] 'Remove bucket' marks the bucket, says so, and offers 'Keep bucket' with focus on it", async () => {
    mocks.getBudgetSummary.mockResolvedValue([...BUCKETS, COUNCIL_GRANT]);
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await user.click(within(panel("Council grant")).getByRole("button", { name: "Remove bucket" }));

    const group = panel("Council grant");
    expect(
      within(group).getByText("Council grant will be removed when you save."),
    ).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "Keep bucket" })).toHaveFocus();
    expect(within(group).queryByRole("button", { name: "Remove bucket" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-11] 'Keep bucket' takes the mark off, and the save keeps it", async () => {
    mocks.getBudgetSummary.mockResolvedValue([...BUCKETS, COUNCIL_GRANT]);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await user.click(
        within(panel("Council grant")).getByRole("button", { name: "Remove bucket" }),
      );
      await user.click(within(panel("Council grant")).getByRole("button", { name: "Keep bucket" }));
      expect(
        within(panel("Council grant")).getByRole("button", { name: "Remove bucket" }),
      ).toHaveFocus();
    });

    expect(within(bucketCard("Council grant")).getByText("$1,200")).toBeInTheDocument();
    expect(historyRows()).toHaveLength(3);
  });

  it("[FAM-UI-05][AC-11] removing a bucket with $0 in it makes a '$0' row, not '-$0'", async () => {
    mocks.getBudgetSummary.mockResolvedValue([
      bucket(undefined, "Empty grant", 0, 0, "bucket-empty"),
    ]);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () =>
      user.click(within(panel("Empty grant")).getByRole("button", { name: "Remove bucket" })),
    );

    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Bucket removed", "$0"]);
    expect(within(fundsCard()).getByText("No funding set up yet")).toBeInTheDocument();
  });
});

describe("[FAM-UI-05] no buckets yet (CHG-021, AC-12)", () => {
  it("[FAM-UI-05][AC-12] Edit budget has no bucket panels, and a new bucket is offered 'NDIS', 'Fixed' and 'Government' as names", async () => {
    mocks.getBudgetSummary.mockResolvedValue([]);
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    expect(within(editForm()).queryAllByRole("group")).toHaveLength(0);
    await user.click(within(editForm()).getByRole("button", { name: "Add bucket" }));

    const suggestions = within(lastNewPanel()).getByRole("group", { name: "Suggested names" });
    const buttons = within(suggestions).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["NDIS", "Fixed", "Government"]);
    for (const button of buttons) expect(button).toHaveAttribute("type", "button");
  });

  it("[FAM-UI-05][AC-12] a suggestion fills the name; saved at $0, Budget shows a 'Government' card with $0 and a 'Bucket added', '$0' row", async () => {
    mocks.getBudgetSummary.mockResolvedValue([]);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await user.click(within(editForm()).getByRole("button", { name: "Add bucket" }));
      const group = lastNewPanel();
      await user.click(within(group).getByRole("button", { name: "Government" }));
      expect(within(group).getByLabelText("Name")).toHaveValue("Government");
      await user.type(within(group).getByLabelText("Starting amount"), "0");
    });

    const cards = within(fundsCard()).getAllByRole("listitem");
    expect(cards).toHaveLength(1);
    expect(within(cards[0]!).getByText("Government")).toBeInTheDocument();
    expect(within(cards[0]!).getByText("$0")).toBeInTheDocument();
    expect(within(cards[0]!).getByText("of $0 · 0% used")).toBeInTheDocument();
    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Bucket added", "$0"]);
  });

  it("[FAM-UI-05][AC-12] a client with only an NDIS bucket is offered 'Fixed' and 'Government'; the match ignores case", async () => {
    mocks.getBudgetSummary.mockResolvedValue([bucket(undefined, "ndis", 1000, 0, "bucket-lower")]);
    const user = userEvent.setup();
    await renderBudget();
    await openEdit();

    await user.click(within(editForm()).getByRole("button", { name: "Add bucket" }));

    const suggestions = within(lastNewPanel()).getByRole("group", { name: "Suggested names" });
    expect(
      within(suggestions)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Fixed", "Government"]);
  });
});

describe("[FAM-UI-05] Edit budget's own states (CHG-021)", () => {
  it("[FAM-UI-05][PRD] reads the route's client through the contract", async () => {
    await renderRoute(EDIT_HREF);

    expect(mocks.getBudgetSummary).toHaveBeenLastCalledWith(CLIENT_ID);
    expect(editForm()).toBeInTheDocument();
  });

  it.each([
    ["getBudgetSummary", () => mocks.getBudgetSummary.mockRejectedValue(new Error("x"))],
    ["getFundHistory", () => mocks.getFundHistory.mockRejectedValue(new Error("x"))],
    ["getToday", () => mocks.getToday.mockRejectedValue(new Error("x"))],
  ])(
    "[FAM-UI-05][PRD] error state: Edit budget shows 'Something went wrong' with Retry, and no form, when %s rejects",
    async (_contractFunction, rejectIt) => {
      const log = captureErrorLog();
      rejectIt();
      const user = userEvent.setup();
      await renderRoute(EDIT_HREF);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.queryByRole("form")).not.toBeInTheDocument();
      expect(log.mock.calls[0]!.join(" ")).toContain("[family-budget]");

      await user.click(screen.getByRole("button", { name: "Retry" }));
      expect(mocks.refresh).toHaveBeenCalledTimes(1);
    },
  );

  it("[FAM-UI-05][PRD] loading state: a labelled status, with no heading, data or controls", () => {
    render(<EditLoading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-05] pending costs (CHG-020, PD-058)", () => {
  it("[FAM-UI-05][AC-07] the Government card reads 'Pending $310 · 1 cost' in words", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    await renderBudget();

    expect(within(bucketCard("Government")).getByText("Pending $310 · 1 cost")).toBeInTheDocument();
    // The remaining figure is not reduced by a cost that has not been paid.
    expect(within(bucketCard("Government")).getByText("$240")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-07] a bucket with no pending costs has no pending line", async () => {
    mocks.getBudgetSummary.mockResolvedValue([
      { ...BUCKETS[0]!, pendingTotal: 0, pendingCount: 0 },
      BUCKETS[1]!,
      BUCKETS_WITH_PENDING[2]!,
    ]);
    await renderBudget();

    expect(within(bucketCard("NDIS")).queryByText(/Pending/)).not.toBeInTheDocument();
    expect(within(bucketCard("Fixed")).queryByText(/Pending/)).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-07] several pending costs are counted in the plural, and cents are kept", async () => {
    mocks.getBudgetSummary.mockResolvedValue([
      BUCKETS[0]!,
      BUCKETS[1]!,
      { ...BUCKETS[2]!, pendingTotal: 1020.5, pendingCount: 2 },
    ]);
    await renderBudget();

    expect(
      within(bucketCard("Government")).getByText("Pending $1,020.50 · 2 costs"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-08] History lists the pending cost with its description, '-$310' and a 'Pending' label in text", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    await renderBudget();

    const rows = dataRows();
    expect(rows).toHaveLength(4);
    // In the contract's order: the pending cost is the second row.
    const [date, description, amount] = within(rows[1]!).getAllByRole("cell");
    expect(date).toHaveTextContent("27 Oct 2026");
    expect(description!.firstElementChild).toHaveTextContent("Physiotherapy");
    expect(amount).toHaveTextContent("-$310");
    expect(within(rows[1]!).getByText("Pending")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-08] only the pending row is labelled 'Pending'", async () => {
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    await renderBudget();

    const labelled = dataRows().filter((row) => within(row).queryByText("Pending"));
    expect(labelled).toHaveLength(1);
    expect(within(labelled[0]!).getByText("Physiotherapy")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-08] the pending row still names who completed the care, and keeps the table's three columns", async () => {
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    await renderBudget();

    expect(within(dataRows()[1]!).getAllByRole("cell")).toHaveLength(3);
    expect(historyAttributions()[1]).toHaveTextContent("Recorded by Aisha Rahman");
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

  it("[FAM-UI-05][AC-03] the bucket cards and 'Edit' are still there when History is empty", async () => {
    mocks.getFundHistory.mockResolvedValue([]);
    await renderBudget();

    expect(within(fundsCard()).getAllByRole("listitem")).toHaveLength(3);
    expect(editLink()).toHaveAttribute("href", EDIT_HREF);
  });

  it("[FAM-UI-05][AC-12] with no buckets, 'Funds by source' says there is no funding yet and to choose 'Edit' to add a bucket; 'Edit' is there and History is unaffected", async () => {
    mocks.getBudgetSummary.mockResolvedValue([]);
    await renderBudget();

    expect(within(fundsCard()).getByText("No funding set up yet")).toBeInTheDocument();
    expect(within(fundsCard()).getByText("Choose ‘Edit’ to add a bucket.")).toBeInTheDocument();
    expect(within(fundsCard()).queryByRole("listitem")).not.toBeInTheDocument();
    expect(editLink()).toHaveAttribute("href", EDIT_HREF);
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
    ["getToday", () => mocks.getToday.mockRejectedValue(new Error("x"))],
  ])(
    "[FAM-UI-05][PRD] error state: shows 'Something went wrong' with Retry when %s rejects",
    async (_contractFunction, rejectIt) => {
      captureErrorLog();
      rejectIt();
      const user = userEvent.setup();
      await renderBudget();

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      // Nothing half-loaded is left on screen beside the error, and no 'Edit' to press.
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();

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

  it("[FAM-UI-05][AC-04] reads today through the contract, once, for dating a saved update", async () => {
    await renderBudget();

    expect(mocks.getToday).toHaveBeenCalledTimes(1);
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

  it("[FAM-UI-05][PRD] cards are keyed by bucket id (CHG-021): when two buckets swap places, each card keeps its element", async () => {
    await renderBudget();
    const ndis = bucketCard("NDIS");
    const fixed = bucketCard("Fixed");

    mocks.getBudgetSummary.mockResolvedValue([BUCKETS[1]!, BUCKETS[0]!, BUCKETS[2]!]);
    await goTo(BUDGET_HREF);

    const cards = within(fundsCard()).getAllByRole("listitem");
    expect(cards[0]).toBe(fixed);
    expect(cards[1]).toBe(ndis);
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
  it("[FAM-UI-05][PRD] Budget, and Budget after a save, have no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = await renderBudget();
    expect(await axe(container)).toHaveNoViolations();

    await editAndSave(user, () => changeFunds(user, "NDIS", "Add", "500"));
    await waitFor(() => expect(status()).toHaveTextContent("Budget updated."));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-05][PRD] Edit budget as it opens, showing errors, with a bucket added and with one marked for removal has no axe violations", async () => {
    mocks.getBudgetSummary.mockResolvedValue([...BUCKETS, COUNCIL_GRANT]);
    const user = userEvent.setup();
    const { container } = await renderBudget();
    await openEdit();
    expect(await axe(container)).toHaveNoViolations();

    await changeFunds(user, "NDIS", "Add", "abc");
    await rename(user, "Fixed", "");
    await save(user);
    expect(await axe(container)).toHaveNoViolations();

    await addBucket(user, "", "");
    expect(await axe(container)).toHaveNoViolations();
    await save(user);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(panel("Council grant")).getByRole("button", { name: "Remove bucket" }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-05][PRD] Edit budget with no buckets and the name suggestions showing has no axe violations", async () => {
    mocks.getBudgetSummary.mockResolvedValue([]);
    const user = userEvent.setup();
    const { container } = await renderBudget();
    await openEdit();
    await user.click(within(editForm()).getByRole("button", { name: "Add bucket" }));

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-05][PRD] pending costs on a card and in History have no axe violations", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const { container } = await renderBudget();

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
    error.unmount();

    // Edit budget's own loading and error states (CHG-021).
    const editLoading = render(<EditLoading />);
    expect(await axe(editLoading.container)).toHaveNoViolations();
    editLoading.unmount();

    const editError = await renderRoute(EDIT_HREF);
    expect(await axe(editError.container)).toHaveNoViolations();
  });
});

/** Government holding two pending costs: an older $310 and a newer $90 (CHG-022). */
const BUCKETS_WITH_TWO_PENDING = [
  BUCKETS[0]!,
  BUCKETS[1]!,
  { ...BUCKETS[2]!, pendingTotal: 400, pendingCount: 2 },
];

const HISTORY_WITH_TWO_PENDING = [
  pendingCost("pending-2", 90, "2026-11-10", "Occupational therapy"),
  HISTORY[0]!,
  pendingCost("pending-1", 310, "2026-10-27", "Physiotherapy"),
  HISTORY[1]!,
  HISTORY[2]!,
];

describe("[FAM-UI-05] Pending costs section (CHG-022, AC-13)", () => {
  it("[FAM-UI-05][AC-13] lists the $310 cost: '27 Oct 2026', 'Government', 'Physiotherapy', '$310'", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    await renderBudget();

    expect(pendingRows()).toEqual([["27 Oct 2026", "Government", "Physiotherapy", "$310"]]);
  });

  it("[FAM-UI-05][AC-13] is a table with the columns Date, Bucket, Description and Amount", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    await renderBudget();

    const headings = within(pendingTable()).getAllByRole("columnheader");
    expect(headings.map((h) => h.textContent)).toEqual(["Date", "Bucket", "Description", "Amount"]);
  });

  it("[FAM-UI-05][AC-13] sits between the bucket cards and History", async () => {
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    await renderBudget();

    expect(screen.getAllByRole("region")).toEqual([fundsCard(), pendingCard(), historyCard()]);
  });

  it("[FAM-UI-05][AC-13] lists several pending costs oldest first, whatever order History has them in", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_TWO_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_TWO_PENDING);
    await renderBudget();

    expect(pendingRows()).toEqual([
      ["27 Oct 2026", "Government", "Physiotherapy", "$310"],
      ["10 Nov 2026", "Government", "Occupational therapy", "$90"],
    ]);
  });

  it("[FAM-UI-05][AC-13] with no pending costs it says 'No pending costs.' and has no table", async () => {
    await renderBudget();

    expect(within(pendingCard()).getByText("No pending costs.")).toBeInTheDocument();
    expect(within(pendingCard()).queryByRole("table")).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-13] a paid cost is not listed; only costs still pending are", async () => {
    mocks.getFundHistory.mockResolvedValue([
      {
        ...pendingCost("paid-1", 50, "2026-10-01", "Taxi"),
        pending: undefined,
        paidOn: "2026-10-05",
      },
      ...HISTORY_WITH_PENDING,
    ]);
    await renderBudget();

    expect(pendingRows()).toEqual([["27 Oct 2026", "Government", "Physiotherapy", "$310"]]);
  });

  it("[FAM-UI-05][AC-13] shows the bucket's name as it is now, after a rename", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => rename(user, "Government", "Government subsidy"));

    expect(pendingRows()[0]![1]).toBe("Government subsidy");
  });

  it("[FAM-UI-05][AC-13] a 300-character description is cut by CSS only: the whole text stays in the DOM and in `title`", async () => {
    const unbroken = "P".repeat(300);
    mocks.getFundHistory.mockResolvedValue([pendingCost("pending-1", 310, "2026-10-27", unbroken)]);
    await renderBudget();

    const [, , description] = within(rowIn(pendingTable(), unbroken)).getAllByRole("cell");
    expect(description!.textContent).toBe(unbroken);
    expect(within(description!).getByTitle(unbroken)).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-13] the error state has no Pending costs section", async () => {
    captureErrorLog();
    mocks.getFundHistory.mockRejectedValue(new Error("x"));
    await renderBudget();

    expect(screen.queryByRole("region", { name: "Pending costs" })).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-05] adding funds pays pending costs (CHG-022, AC-14)", () => {
  it("[FAM-UI-05][AC-14] adding $100 to Government: $30 left, no pending line, 'No pending costs.', and the History row no longer reads 'Pending'", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "Government", "Add", "100"));

    expect(within(bucketCard("Government")).getByText("$30")).toBeInTheDocument();
    expect(within(bucketCard("Government")).queryByText(/Pending/)).not.toBeInTheDocument();
    expect(within(pendingCard()).getByText("No pending costs.")).toBeInTheDocument();
    const physio = rowIn(historyTable(), "Physiotherapy");
    expect(within(physio).queryByText("Pending")).not.toBeInTheDocument();
    // The paid cost keeps its row: one new row for the funds, none for the payment.
    expect(historyRows()).toHaveLength(5);
    expect(within(physio).getAllByRole("cell")[2]).toHaveTextContent("-$310");
  });

  it("[FAM-UI-05][AC-14] adding $50 instead: $290 left and the cost stays pending on the card, in the section and in History", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "Government", "Add", "50"));

    expect(within(bucketCard("Government")).getByText("$290")).toBeInTheDocument();
    expect(within(bucketCard("Government")).getByText("Pending $310 · 1 cost")).toBeInTheDocument();
    expect(pendingRows()).toEqual([["27 Oct 2026", "Government", "Physiotherapy", "$310"]]);
    expect(within(rowIn(historyTable(), "Physiotherapy")).getByText("Pending")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-14] with two pending costs where the older does not fit and the newer would, neither is paid", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_TWO_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_TWO_PENDING);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "Government", "Add", "50"));

    expect(within(bucketCard("Government")).getByText("$290")).toBeInTheDocument();
    expect(
      within(bucketCard("Government")).getByText("Pending $400 · 2 costs"),
    ).toBeInTheDocument();
    expect(pendingRows()).toHaveLength(2);
  });

  it("[FAM-UI-05][AC-14] adding enough for both pays both, oldest first: $40 left", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_TWO_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_TWO_PENDING);
    const user = userEvent.setup();
    await renderBudget();

    // 240 + 200 = 440; 440 - 310 = 130; 130 - 90 = 40.
    await editAndSave(user, () => changeFunds(user, "Government", "Add", "200"));

    expect(within(bucketCard("Government")).getByText("$40")).toBeInTheDocument();
    expect(within(pendingCard()).getByText("No pending costs.")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-14] once paid, Government can be edited again from its new figures, and it says it was paid in its details", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "Government", "Add", "100"));
    await user.click(detailsButton(rowIn(historyTable(), "Physiotherapy")));

    expect(detailsOf(detailsDialog("Physiotherapy")).Status).toBe("Paid on 30 Nov 2026");
  });
});

describe("[FAM-UI-05] entry details (CHG-022, AC-15)", () => {
  beforeEach(() => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
  });

  it("[FAM-UI-05][AC-15] each History row and each pending row has one button, named by its description", async () => {
    await renderBudget();

    expect(
      within(historyTable())
        .getAllByRole("row")
        .slice(1)
        .map((row) => detailsButton(row).textContent),
    ).toEqual([
      "NDIS quarterly plan top-up",
      "Physiotherapy",
      "Fixed funding top-up",
      "Government subsidy payment",
    ]);
    expect(detailsButton(rowIn(pendingTable(), "Physiotherapy"))).toHaveAccessibleName(
      "Physiotherapy",
    );
  });

  it("[FAM-UI-05][AC-15] clicking a History row opens a dialog titled with its description: date, bucket, amount, status and who recorded it", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "NDIS quarterly plan top-up")));

    expect(detailsOf(detailsDialog("NDIS quarterly plan top-up"))).toEqual({
      Date: "3 Nov 2026",
      Bucket: "NDIS",
      Amount: "+$6,000",
      Status: "Paid",
      "Recorded by": "Helen Doyle",
    });
  });

  it("[FAM-UI-05][AC-15] clicking anywhere on the row opens it, not only on the description", async () => {
    const user = userEvent.setup();
    await renderBudget();

    const row = rowIn(historyTable(), "Fixed funding top-up");
    await user.click(within(row).getAllByRole("cell")[2]!);

    expect(detailsDialog("Fixed funding top-up")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-15] a pending cost's details say 'Pending', from History or from the Pending costs section", async () => {
    const user = userEvent.setup();
    await renderBudget();
    const expected = {
      Date: "27 Oct 2026",
      Bucket: "Government",
      Amount: "-$310",
      Status: "Pending",
      "Recorded by": "Aisha Rahman",
    };

    await user.click(detailsButton(rowIn(pendingTable(), "Physiotherapy")));
    expect(detailsOf(detailsDialog("Physiotherapy"))).toEqual(expected);
    await user.click(within(detailsDialog("Physiotherapy")).getByRole("button", { name: "Close" }));

    await user.click(detailsButton(rowIn(historyTable(), "Physiotherapy")));
    expect(detailsOf(detailsDialog("Physiotherapy"))).toEqual(expected);
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("[FAM-UI-05][AC-15] %s on a row's button opens its details", async (_key, keys) => {
    const user = userEvent.setup();
    await renderBudget();

    detailsButton(rowIn(historyTable(), "Government subsidy payment")).focus();
    await user.keyboard(keys);

    expect(detailsDialog("Government subsidy payment")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-15] the row's button is reached with Tab", async () => {
    const user = userEvent.setup();
    await renderBudget();

    const button = detailsButton(rowIn(historyTable(), "NDIS quarterly plan top-up"));
    for (let i = 0; i < 20 && document.activeElement !== button; i++) await user.tab();

    expect(button).toHaveFocus();
  });

  it("[FAM-UI-05][AC-15] opening moves focus into the dialog", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "Physiotherapy")));

    expect(detailsDialog("Physiotherapy").contains(document.activeElement)).toBe(true);
  });

  it.each([
    ["Close", async (user: User) => user.click(screen.getByRole("button", { name: "Close" }))],
    ["Escape", async (user: User) => user.keyboard("{Escape}")],
  ])(
    "[FAM-UI-05][AC-15] %s closes it and focus returns to the row it was opened from",
    async (_how, close) => {
      const user = userEvent.setup();
      await renderBudget();

      const button = detailsButton(rowIn(historyTable(), "Physiotherapy"));
      await user.click(button);
      await close(user);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(button).toHaveFocus();
    },
  );

  it("[FAM-UI-05][AC-15] focus also returns to the row's button when it was opened by clicking elsewhere on the row", async () => {
    const user = userEvent.setup();
    await renderBudget();

    const row = rowIn(pendingTable(), "Physiotherapy");
    await user.click(within(row).getAllByRole("cell")[3]!);
    await user.keyboard("{Escape}");

    expect(detailsButton(row)).toHaveFocus();
  });

  it("[FAM-UI-05][AC-15] only one dialog is open at a time, and it is modal", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "Physiotherapy")));

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(detailsDialog("Physiotherapy")).toHaveAttribute("aria-modal", "true");
  });

  it("[FAM-UI-05][AC-15] an entry with no description opens a dialog titled 'No description'", async () => {
    mocks.getFundHistory.mockResolvedValue([entry("fund-9", "ndis", "topup", 20, "2026-11-20")]);
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "No description")));

    expect(detailsDialog("No description")).toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-15] an entry that does not say who recorded it reads 'Not recorded', not an empty line", async () => {
    mocks.getFundHistory.mockResolvedValue([
      entry("fund-9", "ndis", "topup", 20, "2026-11-20", "Gift", "   "),
    ]);
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "Gift")));

    expect(detailsOf(detailsDialog("Gift"))["Recorded by"]).toBe("Not recorded");
  });

  it("[FAM-UI-05][AC-15] a pending cost since paid reads 'Paid on <date>'", async () => {
    mocks.getFundHistory.mockResolvedValue([
      {
        ...pendingCost("paid-1", 50, "2026-10-01", "Taxi"),
        pending: undefined,
        paidOn: "2026-10-05",
      },
    ]);
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "Taxi")));

    expect(detailsOf(detailsDialog("Taxi")).Status).toBe("Paid on 5 Oct 2026");
  });

  it("[FAM-UI-05][AC-15] shows the note when there is one, and no Note line when there is none", async () => {
    mocks.getFundHistory.mockResolvedValue([
      {
        ...entry("fund-9", "ndis", "topup", 20, "2026-11-20", "Gift", "Helen Doyle"),
        note: "From Tom",
      },
      entry("fund-8", "ndis", "topup", 30, "2026-11-19", "Refund", "Helen Doyle"),
    ]);
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "Gift")));
    expect(detailsOf(detailsDialog("Gift")).Note).toBe("From Tom");
    await user.keyboard("{Escape}");

    await user.click(detailsButton(rowIn(historyTable(), "Refund")));
    expect(detailsOf(detailsDialog("Refund"))).not.toHaveProperty("Note");
  });

  it("[FAM-UI-05][AC-15] a row whose bucket has been removed names it 'Removed bucket'", async () => {
    mocks.getFundHistory.mockResolvedValue([
      {
        ...entry("fund-9", "ndis", "expense", -5, "2026-11-20", "Bucket removed", "you"),
        bucketId: "bucket-gone",
      },
    ]);
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "Bucket removed")));

    expect(detailsOf(detailsDialog("Bucket removed")).Bucket).toBe("Removed bucket");
  });

  it("[FAM-UI-05][AC-15] a very long description and note keep every character in the dialog", async () => {
    const long = "Q".repeat(300);
    mocks.getFundHistory.mockResolvedValue([
      { ...entry("fund-9", "ndis", "topup", 20, "2026-11-20", long, "Helen Doyle"), note: long },
    ]);
    const user = userEvent.setup();
    await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), long)));

    expect(detailsOf(detailsDialog(long)).Note).toBe(long);
  });

  it("[FAM-UI-05][AC-15] the dialog changes nothing: closing it leaves the figures and History as they were", async () => {
    const user = userEvent.setup();
    await renderBudget();
    const before = historyRows();

    await user.click(detailsButton(rowIn(historyTable(), "Physiotherapy")));
    await user.keyboard("{Escape}");

    expect(historyRows()).toEqual(before);
    expect(within(bucketCard("Government")).getByText("$240")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("[FAM-UI-05] who recorded a save, and its note (CHG-022, AC-16)", () => {
  it("[FAM-UI-05][AC-16] adding $500 to NDIS with the note 'Q3 plan review': the first row reads it and 'Recorded by you', and its details show the note", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await changeFunds(user, "NDIS", "Add", "500");
      await writeNote(user, "Q3 plan review");
    });

    expect(historyRows()[0]).toEqual(["30 Nov 2026", "Q3 plan review", "+$500"]);
    expect(historyAttributions()[0]).toHaveTextContent("Recorded by you");

    await user.click(detailsButton(dataRows()[0]!));
    expect(detailsOf(detailsDialog("Q3 plan review"))).toEqual({
      Date: "30 Nov 2026",
      Bucket: "NDIS",
      Amount: "+$500",
      Status: "Paid",
      "Recorded by": "you",
      Note: "Q3 plan review",
    });
  });

  it("[FAM-UI-05][AC-16] a 'Bucket added' row from the same save also shows the note in its details", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await changeFunds(user, "NDIS", "Add", "500");
      await addBucket(user, "Council grant", "1200");
      await writeNote(user, "Q3 plan review");
    });

    const added = rowIn(historyTable(), "Bucket added");
    expect(within(added).getByText("Recorded by you")).toBeInTheDocument();
    await user.click(detailsButton(added));
    expect(detailsOf(detailsDialog("Bucket added"))).toMatchObject({
      Bucket: "Council grant",
      Amount: "+$1,200",
      "Recorded by": "you",
      Note: "Q3 plan review",
    });
  });

  it("[FAM-UI-05][AC-16] a save with no note has no Note in its details", async () => {
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, () => changeFunds(user, "NDIS", "Add", "500"));
    await user.click(detailsButton(dataRows()[0]!));

    expect(detailsOf(detailsDialog("Funds added"))).not.toHaveProperty("Note");
  });
});

describe("[FAM-UI-05] History export (CHG-022, AC-17)", () => {
  it("[FAM-UI-05][AC-17] History has an 'Export' button", async () => {
    await renderBudget();

    expect(exportButton()).toHaveAttribute("type", "button");
  });

  it("[FAM-UI-05][AC-17] pressing it downloads 'budget-history-2026-11-30.csv': the header and one line per row, in the order shown", async () => {
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const downloads = captureDownloads();
    const user = userEvent.setup();
    await renderBudget();

    await user.click(exportButton());

    expect(downloads.clicks).toEqual([
      { download: "budget-history-2026-11-30.csv", href: "blob:budget-export-1" },
    ]);
    expect(downloads.blobs).toHaveLength(1);
    expect(downloads.blobs[0]!.type).toMatch(/^text\/csv/);
    expect(await exportedLines(downloads.blobs[0]!)).toEqual([
      "Date,Bucket,Description,Amount,Status,Recorded by,Note",
      "2026-11-03,NDIS,NDIS quarterly plan top-up,6000.00,Paid,Helen Doyle,",
      "2026-10-27,Government,Physiotherapy,-310.00,Pending,Aisha Rahman,",
      "2026-10-15,Fixed,Fixed funding top-up,1000.00,Paid,Helen Doyle,",
      "2026-10-01,Government,Government subsidy payment,750.00,Paid,Helen Doyle,",
    ]);
  });

  it("[FAM-UI-05][AC-17] the file includes what Phase 1 saves changed: the new row, the note, 'you', and a cost since paid", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_PENDING);
    const downloads = captureDownloads();
    const user = userEvent.setup();
    await renderBudget();

    await editAndSave(user, async () => {
      await changeFunds(user, "Government", "Add", "100");
      await writeNote(user, "=Top-up");
    });
    await user.click(exportButton());

    const lines = await exportedLines(downloads.blobs[0]!);
    expect(lines).toHaveLength(6);
    expect(lines[1]).toBe("2026-11-30,Government,'=Top-up,100.00,Paid,you,'=Top-up");
    expect(lines[3]).toBe(
      "2026-10-27,Government,Physiotherapy,-310.00,Paid on 2026-11-30,Aisha Rahman,",
    );
  });

  it("[FAM-UI-05][AC-17] the object URL is let go once the download has started", async () => {
    const downloads = captureDownloads();
    const user = userEvent.setup();
    await renderBudget();

    await user.click(exportButton());

    await waitFor(() => expect(downloads.revoked).toEqual(["blob:budget-export-1"]));
  });

  it("[FAM-UI-05][AC-17] exporting changes nothing and leaves no link behind on the page", async () => {
    captureDownloads();
    const user = userEvent.setup();
    const { container } = await renderBudget();
    const before = historyRows();

    await user.click(exportButton());

    expect(historyRows()).toEqual(before);
    expect(container.querySelector("a[download]")).toBeNull();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-05][AC-17] with no History rows there is no 'Export' button", async () => {
    mocks.getFundHistory.mockResolvedValue([]);
    await renderBudget();

    expect(within(historyCard()).queryByRole("button", { name: "Export" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-05][AC-17] the error state has no 'Export' button", async () => {
    captureErrorLog();
    mocks.getBudgetSummary.mockRejectedValue(new Error("x"));
    await renderBudget();

    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-05] accessibility of the CHG-022 additions", () => {
  it("[FAM-UI-05][PRD] the Pending costs section, full and empty, and Export have no axe violations", async () => {
    mocks.getBudgetSummary.mockResolvedValue(BUCKETS_WITH_TWO_PENDING);
    mocks.getFundHistory.mockResolvedValue(HISTORY_WITH_TWO_PENDING);
    const full = await renderBudget();
    expect(await axe(full.container)).toHaveNoViolations();
    full.unmount();

    mocks.getBudgetSummary.mockResolvedValue(BUCKETS);
    mocks.getFundHistory.mockResolvedValue(HISTORY);
    const empty = await renderBudget();
    expect(await axe(empty.container)).toHaveNoViolations();
  });

  it("[FAM-UI-05][PRD] the details dialog, with a note and a paid date, has no axe violations", async () => {
    mocks.getFundHistory.mockResolvedValue([
      {
        ...pendingCost("paid-1", 50, "2026-10-01", "Taxi"),
        pending: undefined,
        paidOn: "2026-10-05",
        note: "Paid from the top-up",
      },
    ]);
    const user = userEvent.setup();
    const { container } = await renderBudget();

    await user.click(detailsButton(rowIn(historyTable(), "Taxi")));

    expect(await axe(container)).toHaveNoViolations();
  });
});
