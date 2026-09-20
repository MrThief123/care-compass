import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getTaskLog = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/server/events/queries", () => ({ getTaskLog }));

import {
  fakeTaskLog,
  makeHistory,
  NAME_60,
  TITLE_120,
} from "@/features/family-task-log/fake-task-log";
import type { Occurrence } from "@/types/domain";

import TasksPage from "./page";

const ID = "client-margaret";

type SearchParams = Record<string, string | string[] | undefined>;

function serve(all: Occurrence[]) {
  getTaskLog.mockReset();
  getTaskLog.mockImplementation(fakeTaskLog(all));
}

async function renderPage(searchParams: SearchParams = {}) {
  return render(
    await TasksPage({
      params: Promise.resolve({ clientId: ID }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

const dataRows = () => screen.queryAllByRole("row").slice(1);
const nav = () => screen.getByRole("navigation", { name: "Task log pages" });

const NEEDLE = "Needle-in-a-haystack review";

describe("[FAM-UI-07] Task log page at realistic volume (generated history, not the sample rows)", () => {
  beforeEach(() => serve(makeHistory(537, { titleAt: { 400: NEEDLE } })));

  it("[FAM-UI-07][AC-05] a 537-row log: page 1 has 20 rows and 'Showing 1-20 of 537', asking the contract for that page only", async () => {
    await renderPage();

    expect(dataRows()).toHaveLength(20);
    expect(within(nav()).getByText("Showing 1-20 of 537")).toBeInTheDocument();
    expect(getTaskLog).toHaveBeenCalledExactlyOnceWith(ID, { page: 1 });
  });

  it("[FAM-UI-07][AC-05] the middle of the log has a gap-limited page window, Previous, Next and a way to the last page", async () => {
    await renderPage({ page: "14" });

    expect(within(nav()).getByText("Showing 261-280 of 537")).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Page 27" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?page=27",
    );
    expect(within(nav()).getAllByRole("link").length).toBeLessThanOrEqual(9);
  });

  it("[FAM-UI-07][AC-05] the last page (27) shows only the 17 remaining rows", async () => {
    await renderPage({ page: "27" });

    expect(dataRows()).toHaveLength(17);
    expect(within(nav()).getByText("Showing 521-537 of 537")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-07] a search finds a task from far back in the history (row 401, page 21), which a first-page filter never could", async () => {
    await renderPage({ q: "needle" });

    expect(dataRows()).toHaveLength(1);
    expect(screen.getByRole("link", { name: NEEDLE })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Task log pages" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-07] a Status filter is answered for the whole history and can be paged to its own last page", async () => {
    const overdue = makeHistory(537).filter((item) => item.status === "overdue");
    await renderPage({ status: "overdue", page: String(Math.ceil(overdue.length / 20)) });

    expect(dataRows()).toHaveLength(overdue.length - 20 * (Math.ceil(overdue.length / 20) - 1));
    expect(within(nav()).getByText(new RegExp(`of ${overdue.length}$`))).toBeInTheDocument();
    for (const row of dataRows()) {
      expect(within(row).getByText("Overdue")).toBeInTheDocument();
    }
  });

  it("[FAM-UI-07][AC-06] a page past the end (28 of 27) goes to the last page", async () => {
    await expect(renderPage({ page: "28" })).rejects.toMatchObject({
      digest: expect.stringContaining("/family/client-margaret/tasks?page=27"),
    });
  });

  it("[FAM-UI-07][AC-06] a 5,000-character q reaches the contract as 200 characters", async () => {
    await renderPage({ q: "x".repeat(5000) });

    expect(getTaskLog.mock.calls[0]![1].q).toHaveLength(200);
  });

  it("[FAM-UI-07][AC-06] a page number too big to be real never reaches the contract as a huge number", async () => {
    await expect(renderPage({ page: "9".repeat(400) })).rejects.toMatchObject({
      digest: expect.stringContaining("/family/client-margaret/tasks?page=27"),
    });
    expect(Number.isSafeInteger(getTaskLog.mock.calls[0]![1].page)).toBe(true);
  });

  it("[FAM-UI-07][PRD] 120-character titles and 60-character names on a page render in full without breaking the table", async () => {
    await renderPage({ page: "1" });

    expect(screen.getAllByRole("link", { name: TITLE_120 }).length).toBeGreaterThan(0);
    expect(screen.getAllByTitle(NAME_60).length).toBeGreaterThan(0);
    expect(dataRows()).toHaveLength(20);
  });
});

describe("[FAM-UI-07] Task log page at the edges of a page (generated history)", () => {
  it.each([
    [0, 0, false],
    [1, 1, false],
    [19, 19, false],
    [20, 20, false],
    [21, 20, true],
    [40, 20, true],
    [41, 20, true],
  ])(
    "[FAM-UI-07][AC-05] %i rows: page 1 shows %i rows, and a pager is shown: %s",
    async (count, rowsOnPage1, hasPager) => {
      serve(makeHistory(count));

      await renderPage();

      expect(dataRows()).toHaveLength(rowsOnPage1);
      expect(screen.queryByRole("navigation", { name: "Task log pages" }) !== null).toBe(hasPager);
      if (count === 0) expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    },
  );

  it("[FAM-UI-07][AC-05] one over a full page puts exactly one row on page 2", async () => {
    serve(makeHistory(21));

    await renderPage({ page: "2" });

    expect(dataRows()).toHaveLength(1);
    expect(within(nav()).getByText("Showing 21 of 21")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] a 5,000-row history still costs one contract call per page view", async () => {
    serve(makeHistory(5000));

    await renderPage({ page: "250" });

    expect(dataRows()).toHaveLength(20);
    expect(getTaskLog).toHaveBeenCalledOnce();
  });
});
