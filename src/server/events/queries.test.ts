// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { MARGARET_CLIENT_ID, REFERENCE_DATE } from "@/mocks/fixtures";
import { getOccurrence, getTaskLog, getTodayOccurrences } from "@/server/events/queries";
import { TASK_LOG_PAGE_SIZE } from "@/types/domain";
import type { Occurrence, OccurrenceStatus, TaskLogQuery } from "@/types/domain";

/**
 * Contract tests: they call the `src/server/events` functions the screens
 * call, with DATA_SOURCE=mock, and assert rules that hold for any data set.
 * The fixture-specific expectations live in `src/mocks/fixtures.test.ts`.
 */

const STATUSES: OccurrenceStatus[] = ["done", "overdue", "planned"];

async function readAllPages(clientId: string, query: TaskLogQuery = {}): Promise<Occurrence[]> {
  const rows: Occurrence[] = [];
  for (let page = 1; page <= 200; page += 1) {
    const result = await getTaskLog(clientId, { ...query, page });
    if (result.items.length === 0) return rows;
    rows.push(...result.items);
  }
  throw new Error("readAllPages: more than 200 pages, the log is not terminating");
}

function instant(iso: string): number {
  return Date.parse(iso);
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[UI-04][AC-01] getTaskLog ordering", () => {
  it("[UI-04][AC-01] pages concatenate into one newest-first list, ties by key ascending, no duplicates", async () => {
    const rows = await readAllPages(MARGARET_CLIENT_ID);
    const first = await getTaskLog(MARGARET_CLIENT_ID);

    expect(rows.length).toBe(first.total);
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
    rows.slice(1).forEach((row, index) => {
      const previous = rows[index] as Occurrence;
      const previousStart = instant(previous.start);
      const start = instant(row.start);
      expect(previousStart).toBeGreaterThanOrEqual(start);
      if (previousStart === start) {
        expect(previous.key < row.key).toBe(true);
      }
    });
  });

  it("[UI-04][AC-01] two reads return the same order", async () => {
    const a = await readAllPages(MARGARET_CLIENT_ID);
    const b = await readAllPages(MARGARET_CLIENT_ID);

    expect(b.map((row) => row.key)).toEqual(a.map((row) => row.key));
  });

  it("[UI-04][AC-01] getTodayOccurrences returns only the reference day, oldest first", async () => {
    const rows = await getTodayOccurrences(MARGARET_CLIENT_ID);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.start.slice(0, 10) === REFERENCE_DATE.slice(0, 10))).toBe(true);
    const starts = rows.map((row) => instant(row.start));
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });
});

describe("[UI-04][AC-02] getTaskLog paging", () => {
  it("[UI-04][AC-02] every page but the last is full, and total agrees with the rows", async () => {
    const first = await getTaskLog(MARGARET_CLIENT_ID);
    const pages = Math.ceil(first.total / TASK_LOG_PAGE_SIZE);

    expect(first).toMatchObject({ page: 1, pageSize: TASK_LOG_PAGE_SIZE });
    for (let page = 1; page < pages; page += 1) {
      const result = await getTaskLog(MARGARET_CLIENT_ID, { page });
      expect(result.items).toHaveLength(TASK_LOG_PAGE_SIZE);
      expect(result.total).toBe(first.total);
    }
    const last = await getTaskLog(MARGARET_CLIENT_ID, { page: pages });
    expect(last.items).toHaveLength(first.total - (pages - 1) * TASK_LOG_PAGE_SIZE);
  });

  it("[UI-04][AC-02] a page beyond the last returns no items, the true total and the requested page", async () => {
    const first = await getTaskLog(MARGARET_CLIENT_ID);
    const beyond = Math.ceil(first.total / TASK_LOG_PAGE_SIZE) + 1;

    const result = await getTaskLog(MARGARET_CLIENT_ID, { page: beyond });

    expect(result).toEqual({
      items: [],
      page: beyond,
      pageSize: TASK_LOG_PAGE_SIZE,
      total: first.total,
    });
  });

  it("[UI-04][AC-02] an unknown client has an empty log rather than an error", async () => {
    expect(await getTaskLog("client-does-not-exist")).toEqual({
      items: [],
      page: 1,
      pageSize: TASK_LOG_PAGE_SIZE,
      total: 0,
    });
  });

  it("[UI-04][AC-02] object-prototype names are unknown clients, not errors", async () => {
    for (const clientId of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      const result = await getTaskLog(clientId);
      expect(result.total).toBe(0);
      expect(await getTodayOccurrences(clientId)).toEqual([]);
    }
  });
});

describe("[UI-04][AC-03] getTaskLog input validation", () => {
  it.each([
    ["0", 0],
    ["-1", -1],
    ["-3", -3],
    ["1.5", 1.5],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
  ])("[UI-04][AC-03] page %s rejects with a Zod validation error", async (_label, page) => {
    await expect(getTaskLog(MARGARET_CLIENT_ID, { page })).rejects.toBeInstanceOf(ZodError);
  });

  it("[UI-04][AC-03] a page that is not a number rejects", async () => {
    const query = { page: "2" } as unknown as TaskLogQuery;

    await expect(getTaskLog(MARGARET_CLIENT_ID, query)).rejects.toBeInstanceOf(ZodError);
  });

  it("[UI-04][AC-03] an unknown status rejects", async () => {
    const query = { status: "bogus" } as unknown as TaskLogQuery;

    await expect(getTaskLog(MARGARET_CLIENT_ID, query)).rejects.toBeInstanceOf(ZodError);
  });

  it("[UI-04][AC-03] an omitted or undefined page means page 1", async () => {
    expect((await getTaskLog(MARGARET_CLIENT_ID)).page).toBe(1);
    expect((await getTaskLog(MARGARET_CLIENT_ID, {})).page).toBe(1);
    expect((await getTaskLog(MARGARET_CLIENT_ID, { page: undefined })).page).toBe(1);
  });

  it("[UI-04][AC-03] a very large valid page is an empty page, not an error", async () => {
    const first = await getTaskLog(MARGARET_CLIENT_ID);

    const result = await getTaskLog(MARGARET_CLIENT_ID, { page: Number.MAX_SAFE_INTEGER });

    expect(result).toEqual({
      items: [],
      page: Number.MAX_SAFE_INTEGER,
      pageSize: TASK_LOG_PAGE_SIZE,
      total: first.total,
    });
  });
});

describe("[UI-04][AC-04] getTaskLog filters over the whole history", () => {
  it.each(STATUSES)(
    "[UI-04][AC-04] status %s: total equals the rows found by paging, all with that status",
    async (status) => {
      const first = await getTaskLog(MARGARET_CLIENT_ID, { status });
      const rows = await readAllPages(MARGARET_CLIENT_ID, { status });

      expect(rows).toHaveLength(first.total);
      expect(rows.every((row) => row.status === status)).toBe(true);
    },
  );

  it("[UI-04][AC-04] q matches any case and surrounding spaces", async () => {
    const all = await readAllPages(MARGARET_CLIENT_ID);
    const title = (all[0] as Occurrence).title;
    const needle = title.slice(0, 5);
    const expected = all.filter((row) => row.title.toLowerCase().includes(needle.toLowerCase()));

    const result = await readAllPages(MARGARET_CLIENT_ID, { q: `  ${needle.toUpperCase()}  ` });

    expect(result.map((row) => row.key)).toEqual(expected.map((row) => row.key));
  });

  it("[UI-04][AC-04] q and status combine: total counts only rows matching both", async () => {
    const all = await readAllPages(MARGARET_CLIENT_ID);
    const sample = all.find((row) => row.status === "done") as Occurrence;
    const q = sample.title.slice(0, 4);
    const expected = all.filter(
      (row) => row.status === "done" && row.title.toLowerCase().includes(q.toLowerCase()),
    );

    const result = await getTaskLog(MARGARET_CLIENT_ID, { q, status: "done" });

    expect(result.total).toBe(expected.length);
    expect(result.items.map((row) => row.key)).toEqual(
      expected.slice(0, TASK_LOG_PAGE_SIZE).map((row) => row.key),
    );
  });

  it("[UI-04][AC-04] a q with no match gives total 0 on page 1", async () => {
    expect(await getTaskLog(MARGARET_CLIENT_ID, { q: "Zoe" })).toEqual({
      items: [],
      page: 1,
      pageSize: TASK_LOG_PAGE_SIZE,
      total: 0,
    });
  });
});

describe("[UI-04][AC-05] getOccurrence", () => {
  it.each(STATUSES)("[UI-04][AC-05] finds a %s occurrence by key", async (status) => {
    const sample = (await getTaskLog(MARGARET_CLIENT_ID, { status })).items[0] as Occurrence;

    expect(await getOccurrence(MARGARET_CLIENT_ID, sample.key)).toEqual(sample);
  });

  it("[UI-04][AC-05] finds the Morning medication occurrence the Home links use", async () => {
    const key = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";

    const found = await getOccurrence(MARGARET_CLIENT_ID, key);

    expect(found).toMatchObject({ key, title: "Morning medication", clientId: MARGARET_CLIENT_ID });
  });

  it("[UI-04][AC-05] returns undefined for an unknown key", async () => {
    expect(
      await getOccurrence(MARGARET_CLIENT_ID, "no-such-event:2026-01-01T00:00:00+11:00"),
    ).toBeUndefined();
    expect(await getOccurrence(MARGARET_CLIENT_ID, "")).toBeUndefined();
  });

  it("[UI-04][AC-05] returns undefined for an unknown client, even with a real key", async () => {
    const real = (await getTaskLog(MARGARET_CLIENT_ID)).items[0] as Occurrence;

    expect(await getOccurrence("client-does-not-exist", real.key)).toBeUndefined();
    expect(await getOccurrence("client-robert", real.key)).toBeUndefined();
  });

  it("[UI-04][AC-05] object-prototype names are unknown clients, not errors", async () => {
    const real = (await getTaskLog(MARGARET_CLIENT_ID)).items[0] as Occurrence;

    for (const clientId of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(await getOccurrence(clientId, real.key)).toBeUndefined();
    }
  });
});

describe("[UI-04][AC-07] supabase mode", () => {
  it("[UI-04][AC-07] getOccurrence throws the not-implemented error naming its domain and function", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");

    await expect(getOccurrence(MARGARET_CLIENT_ID, "any:key")).rejects.toThrow(
      /events\.getOccurrence: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});
