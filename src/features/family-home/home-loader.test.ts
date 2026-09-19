import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Occurrence, OccurrenceStatus, TaskLogQuery, TaskLogResult } from "@/types/domain";

import { OVERDUE_ROWS_SHOWN, RECENT_ACTIVITY_LIMIT, loadFamilyHomeData } from "./home-data";
import { CLIENT_ID, melbourne, occurrence } from "./test-support";


const mocks = vi.hoisted(() => ({
  getTodayOccurrences: vi.fn(),
  getTaskLog: vi.fn(),
  getBudgetSummary: vi.fn(),
}));

vi.mock("@/server/events/queries", () => ({
  getTodayOccurrences: mocks.getTodayOccurrences,
  getTaskLog: mocks.getTaskLog,
}));
vi.mock("@/server/budget/queries", () => ({ getBudgetSummary: mocks.getBudgetSummary }));

const PAGE_SIZE = 20;

function byNewest(a: Occurrence, b: Occurrence): number {
  return Date.parse(b.start) - Date.parse(a.start) || a.key.localeCompare(b.key);
}

/** A task log with the contract's rules: filtered, newest first, twenty to a page, `total` after filters. */
function contractOver(log: Occurrence[]) {
  return async (_clientId: string, query: TaskLogQuery = {}): Promise<TaskLogResult> => {
    const matching = log
      .filter((row) => !query.status || row.status === query.status)
      .sort(byNewest);
    const page = query.page ?? 1;
    return {
      items: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      page,
      pageSize: PAGE_SIZE,
      total: matching.length,
    };
  };
}

/** `count` rows of one status, an hour apart, the newest ending at `newestMinutesAgo` before Mon 30 Nov 2026 09:00. */
function history(status: OccurrenceStatus, count: number, offsetMinutes = 0): Occurrence[] {
  const newest = Date.parse(melbourne("09:00"));
  return Array.from({ length: count }, (_, index) =>
    occurrence({
      title: `${status} ${index + 1}`,
      start: new Date(newest - offsetMinutes * 60_000 - index * 3_600_000).toISOString(),
      status,
      ...(status === "done" ? { actor: "Aisha Rahman" } : {}),
    }),
  );
}

function titles(rows: Occurrence[]): string[] {
  return rows.map((row) => row.title);
}

beforeEach(() => {
  mocks.getTodayOccurrences.mockResolvedValue([]);
  mocks.getBudgetSummary.mockResolvedValue([]);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("[FAM-UI-01][PRD] Recent activity is right for any length of history", () => {
  it("[FAM-UI-01][PRD] takes the newest five of 500 done and 500 overdue rows, however they interleave", async () => {
    // Done and overdue rows alternate in time, thirty minutes apart, so the newest five mix both.
    const done = history("done", 500);
    const overdue = history("overdue", 500, 30);
    const everything = [...done, ...overdue];
    mocks.getTaskLog.mockImplementation(contractOver(everything));

    const { recent } = await loadFamilyHomeData(CLIENT_ID);

    const expected = everything.sort(byNewest).slice(0, RECENT_ACTIVITY_LIMIT);
    expect(RECENT_ACTIVITY_LIMIT).toBe(5);
    expect(recent).toEqual(expected);
    expect(new Set(recent.map((row) => row.status))).toEqual(new Set(["done", "overdue"]));
  });

  it("[FAM-UI-01][PRD] is right when the newest five are all one status and the other is years older", async () => {
    const done = history("done", 500);
    const overdue = history("overdue", 500, 60 * 24 * 365 * 3);
    mocks.getTaskLog.mockImplementation(contractOver([...done, ...overdue]));

    const { recent } = await loadFamilyHomeData(CLIENT_ID);

    expect(titles(recent)).toEqual(["done 1", "done 2", "done 3", "done 4", "done 5"]);
  });

  it("[FAM-UI-01][PRD] asks the contract for each status Recent activity shows, page one, never an unfiltered log", async () => {
    mocks.getTaskLog.mockImplementation(contractOver(history("done", 500)));

    await loadFamilyHomeData(CLIENT_ID);

    const queries = mocks.getTaskLog.mock.calls.map(
      ([, query]) => query as TaskLogQuery | undefined,
    );
    expect(queries.length).toBeGreaterThan(0);
    for (const query of queries) {
      expect(query, "every call filters by status").toBeDefined();
      expect(["done", "overdue"]).toContain(query!.status);
      expect(query!.page ?? 1, "only page one is ever needed").toBe(1);
    }
    expect(queries.map((query) => query!.status).sort()).toEqual(
      expect.arrayContaining(["done", "overdue"]),
    );
    // Planned rows are the future; they are never asked for.
    expect(queries.some((query) => query!.status === "planned")).toBe(false);
  });

  it("[FAM-UI-01][PRD] still takes only five when a contract hands back a whole 500-row list", async () => {
    // A stand-in that ignores paging: the screen must not trust a page to be small.
    const done = history("done", 500);
    const overdue = history("overdue", 500, 30);
    mocks.getTaskLog.mockImplementation(async (_id: string, query: TaskLogQuery) => {
      const rows = (query.status === "done" ? done : overdue).slice().sort(byNewest);
      return { items: rows, page: 1, pageSize: PAGE_SIZE, total: rows.length };
    });

    const { recent, overdue: overdueCard } = await loadFamilyHomeData(CLIENT_ID);

    expect(recent).toHaveLength(5);
    expect(overdueCard.items).toHaveLength(OVERDUE_ROWS_SHOWN);
    expect(overdueCard.total).toBe(500);
  });

  it("[FAM-UI-01][PRD] is not fooled by planned rows newer than the whole history: 30 planned, 500 done, 500 overdue", async () => {
    // The unfiltered log is newest first, so thirty planned rows fill page one and hide every done and overdue row.
    const planned = history("planned", 30, -60 * 24);
    const done = history("done", 500);
    const overdue = history("overdue", 500, 30);
    mocks.getTaskLog.mockImplementation(contractOver([...planned, ...done, ...overdue]));

    const { recent } = await loadFamilyHomeData(CLIENT_ID);

    const expected = [...done, ...overdue].sort(byNewest).slice(0, RECENT_ACTIVITY_LIMIT);
    expect(recent).toEqual(expected);
    expect(recent.every((row) => row.status !== "planned")).toBe(true);
  });

  it("[FAM-UI-01][PRD] breaks a tie on the start instant by key ascending, as the contract does", async () => {
    const start = melbourne("09:00");
    const rows = ["b", "c", "a"].map((id) =>
      occurrence({ title: `Tied ${id}`, start, status: "done", key: `event-${id}:${start}` }),
    );
    mocks.getTaskLog.mockImplementation(contractOver(rows));

    const { recent } = await loadFamilyHomeData(CLIENT_ID);

    expect(titles(recent)).toEqual(["Tied a", "Tied b", "Tied c"]);
  });

  it("[FAM-UI-01][PRD] gives no rows for a client with no history", async () => {
    mocks.getTaskLog.mockImplementation(contractOver([]));

    const data = await loadFamilyHomeData(CLIENT_ID);

    expect(data.recent).toEqual([]);
    expect(data.overdue).toEqual({ items: [], total: 0 });
  });

  it("[FAM-UI-01][PRD] gives the one row of a client with a single completed event", async () => {
    const only = history("done", 1);
    mocks.getTaskLog.mockImplementation(contractOver(only));

    const data = await loadFamilyHomeData(CLIENT_ID);

    expect(data.recent).toEqual(only);
    expect(data.overdue.total).toBe(0);
  });

  it("[FAM-UI-01][PRD] gives exactly five rows for exactly five, with none dropped or repeated", async () => {
    const five = [...history("done", 3), ...history("overdue", 2, 30)];
    mocks.getTaskLog.mockImplementation(contractOver(five));

    const { recent } = await loadFamilyHomeData(CLIENT_ID);

    expect(recent).toHaveLength(5);
    expect(new Set(recent.map((row) => row.key)).size).toBe(5);
    expect(recent).toEqual([...five].sort(byNewest));
  });

  it("[FAM-UI-01][PRD] never lists the same occurrence twice, even if a contract repeats one across statuses", async () => {
    const shared = history("done", 1)[0]!;
    mocks.getTaskLog.mockImplementation(async () => ({
      items: [shared],
      page: 1,
      pageSize: PAGE_SIZE,
      total: 1,
    }));

    const { recent } = await loadFamilyHomeData(CLIENT_ID);

    expect(recent).toEqual([shared]);
  });
});

describe("[FAM-UI-01][AC-02] Overdue card comes from the contract's total, not from how many rows it got", () => {
  it("[FAM-UI-01][AC-02] reports 40 overdue as 40, shows the newest five, and lists them oldest first", async () => {
    const overdue = history("overdue", 40);
    mocks.getTaskLog.mockImplementation(contractOver(overdue));

    const { overdue: card } = await loadFamilyHomeData(CLIENT_ID);

    expect(OVERDUE_ROWS_SHOWN).toBe(5);
    expect(card.total).toBe(40);
    expect(titles(card.items)).toEqual([
      "overdue 5",
      "overdue 4",
      "overdue 3",
      "overdue 2",
      "overdue 1",
    ]);
  });

  it("[FAM-UI-01][AC-02] shows all of them, oldest first, when there are fewer than five", async () => {
    mocks.getTaskLog.mockImplementation(contractOver(history("overdue", 3)));

    const { overdue: card } = await loadFamilyHomeData(CLIENT_ID);

    expect(card.total).toBe(3);
    expect(titles(card.items)).toEqual(["overdue 3", "overdue 2", "overdue 1"]);
  });
});

describe("[FAM-UI-01][AC-06] one failing contract call fails the whole load", () => {
  it.each(["done", "overdue"] as const)(
    "[FAM-UI-01][AC-06] rejects when the %s call rejects",
    async (failing) => {
      mocks.getTaskLog.mockImplementation(async (_id: string, query: TaskLogQuery) => {
        if (query.status === failing) throw new Error("down");
        return { items: [], page: 1, pageSize: PAGE_SIZE, total: 0 };
      });

      await expect(loadFamilyHomeData(CLIENT_ID)).rejects.toThrow("down");
    },
  );
});
