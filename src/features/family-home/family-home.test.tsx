import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Loading from "@/app/(family)/family/[clientId]/home/loading";
import FamilyHomePage from "@/app/(family)/family/[clientId]/home/page";
import type { BudgetBucketSummary, Occurrence, TaskLogResult } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  getTodayOccurrences: vi.fn(),
  getTaskLog: vi.fn(),
  getBudgetSummary: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/server/events/queries", () => ({
  getTodayOccurrences: mocks.getTodayOccurrences,
  getTaskLog: mocks.getTaskLog,
}));
vi.mock("@/server/budget/queries", () => ({
  getBudgetSummary: mocks.getBudgetSummary,
}));

/*
 * The screen reads only through the `src/server/**` contract, so these tests
 * replace that contract with fixtures that mirror the Family · Home design
 * (TEST_PLAN "Test data": a test may create its own fixtures). The repo's
 * `src/mocks` fixtures do not carry the design's Home dataset; see DECISIONS.md.
 */
const CLIENT_ID = "client-margaret";

function occurrence(
  fields: Pick<Occurrence, "title" | "start" | "status"> & Partial<Occurrence>,
): Occurrence {
  const eventId = `event-${fields.title.toLowerCase().replace(/\W+/g, "-")}`;
  return {
    key: `${eventId}:${fields.start}`,
    eventId,
    clientId: CLIENT_ID,
    description: "",
    durationMinutes: 60,
    ...fields,
  };
}

function taskLog(items: Occurrence[], total = items.length): TaskLogResult {
  return { items, page: 1, pageSize: 20, total };
}

const MORNING_MEDS = occurrence({
  title: "Morning medication",
  start: "2026-11-30T09:00:00+11:00",
  durationMinutes: 60,
  status: "done",
  actor: "Aisha Rahman",
  assignee: "Aisha Rahman",
});
const PHYSIOTHERAPY = occurrence({
  title: "Physiotherapy",
  start: "2026-11-30T11:30:00+11:00",
  durationMinutes: 90,
  status: "planned",
  assignee: "Aisha Rahman",
});
const CHECK_IN = occurrence({
  title: "Afternoon check-in",
  start: "2026-11-30T15:00:00+11:00",
  durationMinutes: 60,
  status: "planned",
  assignee: "Aisha Rahman",
});

const WOUND_DRESSING = occurrence({
  title: "Wound dressing check",
  start: "2026-11-27T10:00:00+11:00",
  status: "overdue",
});
const MEDICATION_REVIEW = occurrence({
  title: "Medication review",
  start: "2026-11-28T08:00:00+11:00",
  status: "overdue",
});
const WEIGH_IN = occurrence({
  title: "Weekly weigh-in",
  start: "2026-11-29T10:00:00+11:00",
  status: "overdue",
});
const EVENING_MEDS = occurrence({
  title: "Evening medication",
  start: "2026-11-29T18:00:00+11:00",
  status: "done",
  actor: "Aisha Rahman",
});
const PAST_PHYSIOTHERAPY = occurrence({
  title: "Physiotherapy",
  start: "2026-11-28T11:30:00+11:00",
  durationMinutes: 90,
  status: "done",
  actor: "Aisha Rahman",
});

/** The whole task log, deliberately not in date order. */
const TASK_LOG = [
  WOUND_DRESSING,
  PAST_PHYSIOTHERAPY,
  MEDICATION_REVIEW,
  MORNING_MEDS,
  WEIGH_IN,
  PHYSIOTHERAPY,
  EVENING_MEDS,
  CHECK_IN,
];

const BUDGET: BudgetBucketSummary[] = [
  {
    kind: "ndis",
    label: "NDIS",
    total: 24000,
    used: 9120,
    remaining: 14880,
    percentUsed: 38,
    state: "ok",
  },
  {
    kind: "fixed",
    label: "Fixed",
    total: 5000,
    used: 2250,
    remaining: 2750,
    percentUsed: 45,
    state: "ok",
  },
  {
    kind: "government",
    label: "Government",
    total: 3000,
    used: 2760,
    remaining: 240,
    percentUsed: 92,
    state: "alert",
  },
];

/** Answers `getTaskLog` the way the contract does: filtered by `query.status`. */
function answerTaskLog(overdue: Occurrence[], everything: Occurrence[]) {
  mocks.getTaskLog.mockImplementation(async (_clientId: string, query?: { status?: string }) =>
    query?.status === "overdue" ? taskLog(overdue) : taskLog(everything),
  );
}

beforeEach(() => {
  // Only `Date` is faked, so the Today caption is deterministic while
  // timers, and therefore user-event and the hover card's delay, stay real.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-30T09:00:00+11:00"));

  mocks.getTodayOccurrences.mockResolvedValue([MORNING_MEDS, PHYSIOTHERAPY, CHECK_IN]);
  answerTaskLog([WEIGH_IN, WOUND_DRESSING, MEDICATION_REVIEW], TASK_LOG);
  mocks.getBudgetSummary.mockResolvedValue(BUDGET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

/** The page logs a tagged line when the contract rejects; keep it out of the test output. */
function captureErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

async function renderHome() {
  const page = await FamilyHomePage({ params: Promise.resolve({ clientId: CLIENT_ID }) });
  return render(page);
}

describe("[FAM-UI-01] Family Home", () => {
  it("[FAM-UI-01][AC-01] Today panel shows Morning medication (Done · Aisha Rahman), Physiotherapy (Planned, 1 hr 30 min) and Afternoon check-in (Planned)", async () => {
    await renderHome();
    const today = screen.getByRole("region", { name: "Today" });

    // Everything is on the block itself, at rest: no hover or focus is needed to read it.
    const morning = within(today).getByRole("link", { name: /Morning medication/ });
    expect(within(morning).getByText("Morning medication")).toBeInTheDocument();
    expect(within(morning).getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(within(morning).getByText("1 hr")).toBeInTheDocument();

    const physio = within(today).getByRole("link", { name: /Physiotherapy/ });
    expect(within(physio).getByText("Physiotherapy")).toBeInTheDocument();
    expect(within(physio).getByText("1 hr 30 min")).toBeInTheDocument();
    expect(within(physio).getByText("Planned")).toBeInTheDocument();

    const checkIn = within(today).getByRole("link", { name: /Afternoon check-in/ });
    expect(within(checkIn).getByText("Afternoon check-in")).toBeInTheDocument();
    expect(within(checkIn).getByText("Planned")).toBeInTheDocument();

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("[FAM-UI-01][AC-02] Overdue card badge is 3 and lists Wound dressing check (Fri 27 Nov), Medication review (Sat 28 Nov), Weekly weigh-in (Sun 29 Nov), oldest first", async () => {
    await renderHome();
    const overdue = screen.getByRole("region", { name: "Overdue" });

    expect(within(overdue).getByText("3")).toBeInTheDocument();

    const rows = within(overdue).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByText("Wound dressing check")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("Fri 27 Nov")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Medication review")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Sat 28 Nov")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("Weekly weigh-in")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("Sun 29 Nov")).toBeInTheDocument();
    for (const row of rows) {
      expect(within(row).getByText("Overdue")).toBeInTheDocument();
    }
  });

  it("[FAM-UI-01][AC-03] budget line reads '$17,870 remaining of $32,000 · 44% used' and Government is in alert state", async () => {
    await renderHome();
    const budget = screen.getByRole("region", { name: "Budget" });

    expect(within(budget).getByText("$17,870 remaining of $32,000 · 44% used")).toBeInTheDocument();

    const cards = within(budget).getAllByRole("listitem");
    expect(cards).toHaveLength(3);
    const [ndis, fixed, government] = cards as [HTMLElement, HTMLElement, HTMLElement];
    expect(within(ndis).getByText("NDIS")).toBeInTheDocument();
    expect(within(fixed).getByText("Fixed")).toBeInTheDocument();
    expect(within(government).getByText("Government")).toBeInTheDocument();

    // Alert state is a warning icon, the amount and the bar's own label, not
    // colour alone; the two healthy buckets carry none of them.
    expect(within(government).getByText("$240")).toBeInTheDocument();
    expect(within(government).getByTestId("icon-alert-triangle")).toBeInTheDocument();
    expect(
      within(government).getByRole("progressbar", { name: "Government budget, 92% used" }),
    ).toHaveAttribute("aria-valuenow", "92");
    expect(within(ndis).queryByTestId("icon-alert-triangle")).not.toBeInTheDocument();
    expect(within(fixed).queryByTestId("icon-alert-triangle")).not.toBeInTheDocument();
  });

  it("[FAM-UI-01][AC-04] Recent activity 'View all' targets /family/<id>/tasks", async () => {
    await renderHome();
    const recent = screen.getByRole("region", { name: "Recent activity" });

    expect(within(recent).getByRole("link", { name: "View all" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-01][AC-05] Overdue card shows 'All caught up' when nothing is overdue", async () => {
    answerTaskLog([], TASK_LOG);
    await renderHome();
    const overdue = screen.getByRole("region", { name: "Overdue" });

    expect(within(overdue).getByText("All caught up")).toBeInTheDocument();
    expect(within(overdue).queryByRole("listitem")).not.toBeInTheDocument();
  });

  it.each([
    ["getTodayOccurrences", () => mocks.getTodayOccurrences.mockRejectedValue(new Error("x"))],
    ["getTaskLog", () => mocks.getTaskLog.mockRejectedValue(new Error("x"))],
    ["getBudgetSummary", () => mocks.getBudgetSummary.mockRejectedValue(new Error("x"))],
  ])(
    "[FAM-UI-01][AC-06] shows 'Something went wrong' with Retry when %s rejects",
    async (_contractFunction, rejectIt) => {
      captureErrorLog();
      rejectIt();
      const user = userEvent.setup();
      await renderHome();

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      // Nothing half-loaded is left on screen beside the error.
      expect(screen.queryByRole("region", { name: "Today" })).not.toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Budget" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Retry" }));
      expect(mocks.refresh).toHaveBeenCalledTimes(1);
    },
  );

  it("[FAM-UI-01][AC-06] logs a feature-tagged line, without the error's message, when the contract rejects", async () => {
    // ARCHITECTURE.md §12.5: log with a feature tag; never log PII or medical text.
    const log = captureErrorLog();
    mocks.getBudgetSummary.mockRejectedValue(new Error("no funding row for Margaret Doyle"));
    await renderHome();

    expect(log).toHaveBeenCalledTimes(1);
    const logged = log.mock.calls[0]!.join(" ");
    expect(logged).toContain("[family-home]");
    expect(logged).not.toContain("Margaret");
    expect(logged).not.toContain("no funding row");
  });
});

describe("[FAM-UI-01] Family Home layout and navigation (PRD Scope, no AC)", () => {
  it("[FAM-UI-01][Scope] reads every panel through the contract for the route's client", async () => {
    await renderHome();

    expect(mocks.getTodayOccurrences).toHaveBeenCalledWith(CLIENT_ID);
    expect(mocks.getTaskLog).toHaveBeenCalledWith(CLIENT_ID, { status: "overdue" });
    expect(mocks.getTaskLog).toHaveBeenCalledWith(CLIENT_ID);
    expect(mocks.getBudgetSummary).toHaveBeenCalledWith(CLIENT_ID);
  });

  it("[FAM-UI-01][Scope] Today panel is captioned 'Mon 30 Nov · day view'", async () => {
    await renderHome();
    const today = screen.getByRole("region", { name: "Today" });

    expect(within(today).getByText("Mon 30 Nov · day view")).toBeInTheDocument();
  });

  it("[FAM-UI-01][Scope] 'Enter event' is a primary link to /family/<id>/events/new", async () => {
    await renderHome();

    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      "/family/client-margaret/events/new",
    );
  });

  it("[FAM-UI-01][Scope] 'View breakdown' links to /family/<id>/budget and the three buckets are NDIS, Fixed, Government", async () => {
    await renderHome();
    const budget = screen.getByRole("region", { name: "Budget" });

    expect(within(budget).getByRole("link", { name: "View breakdown" })).toHaveAttribute(
      "href",
      "/family/client-margaret/budget",
    );
    const labels = within(budget)
      .getAllByRole("listitem")
      .map((card) => within(card).getByText(/^(NDIS|Fixed|Government)$/).textContent);
    expect(labels).toEqual(["NDIS", "Fixed", "Government"]);
  });

  it("[FAM-UI-01][Scope] Recent activity lists the five latest done or overdue occurrences, newest first", async () => {
    await renderHome();
    const recent = screen.getByRole("region", { name: "Recent activity" });

    const rows = within(recent).getAllByRole("listitem");
    const titles = rows.map((row) => row.querySelector("p")?.textContent);
    expect(titles).toEqual([
      "Morning medication",
      "Evening medication",
      "Weekly weigh-in",
      "Physiotherapy",
      "Medication review",
    ]);
    // Done rows say who did it (REQ-19); overdue rows say Overdue.
    expect(within(rows[0]!).getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("Mon 30 Nov")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("Overdue")).toBeInTheDocument();
    // The oldest overdue item, today's planned events and the sixth row stay out.
    expect(within(recent).queryByText("Wound dressing check")).not.toBeInTheDocument();
    expect(within(recent).queryByText("Afternoon check-in")).not.toBeInTheDocument();
  });

  it("[FAM-UI-01][Scope] a Recent activity chevron opens that occurrence's task detail", async () => {
    const user = userEvent.setup();
    await renderHome();
    const recent = screen.getByRole("region", { name: "Recent activity" });

    await user.click(within(recent).getByRole("button", { name: /Evening medication/ }));

    // The key holds ':' and '+', so it is encoded into the /tasks/[occurrenceKey] segment.
    expect(mocks.push).toHaveBeenCalledWith(
      `/family/client-margaret/tasks/${encodeURIComponent(EVENING_MEDS.key)}`,
    );
  });

  it("[FAM-UI-01][Scope] an Overdue row chevron opens that occurrence's task detail", async () => {
    const user = userEvent.setup();
    await renderHome();
    const overdue = screen.getByRole("region", { name: "Overdue" });

    await user.click(within(overdue).getByRole("button", { name: /Wound dressing check/ }));

    expect(mocks.push).toHaveBeenCalledWith(
      `/family/client-margaret/tasks/${encodeURIComponent(WOUND_DRESSING.key)}`,
    );
  });
});

describe("[FAM-UI-01] Family Home empty and loading states (PRD Scope, OQ-24 default)", () => {
  it("[FAM-UI-01][Scope] Today panel shows an empty state when there are no events today", async () => {
    mocks.getTodayOccurrences.mockResolvedValue([]);
    await renderHome();
    const today = screen.getByRole("region", { name: "Today" });

    expect(within(today).getByText("No care events today")).toBeInTheDocument();
  });

  it("[FAM-UI-01][Scope] Recent activity shows an empty state when there is no history", async () => {
    answerTaskLog([], []);
    await renderHome();
    const recent = screen.getByRole("region", { name: "Recent activity" });

    expect(within(recent).getByText("No recent activity")).toBeInTheDocument();
    // 'View all' still leads to the Task log.
    expect(within(recent).getByRole("link", { name: "View all" })).toBeInTheDocument();
  });

  it("[FAM-UI-01][Scope] Budget strip shows an empty state, not $0 figures, for a client with no funding", async () => {
    mocks.getBudgetSummary.mockResolvedValue([]);
    await renderHome();
    const budget = screen.getByRole("region", { name: "Budget" });

    expect(within(budget).getByText("No funding set up yet")).toBeInTheDocument();
    expect(within(budget).queryByText(/remaining of/)).not.toBeInTheDocument();
    expect(within(budget).queryByRole("listitem")).not.toBeInTheDocument();
    expect(within(budget).getByRole("link", { name: "View breakdown" })).toBeInTheDocument();
  });

  it("[FAM-UI-01][Scope] loading skeleton announces itself as loading and holds no data", () => {
    render(<Loading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-01] Family Home accessibility (REQ-N2)", () => {
  it("[FAM-UI-01][Scope] populated screen has no axe violations", async () => {
    const { container } = await renderHome();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-01][Scope] error state has no axe violations", async () => {
    captureErrorLog();
    mocks.getBudgetSummary.mockRejectedValue(new Error("x"));
    const { container } = await renderHome();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-01][Scope] loading skeleton has no axe violations", async () => {
    const { container } = render(<Loading />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
