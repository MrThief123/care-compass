import { describe, expect, it } from "vitest";

import { findOccurrence, occurrencesOnDay, queryTaskLog } from "@/mocks/queries/events";
import { TASK_LOG_PAGE_SIZE } from "@/types/domain";

import type { Occurrence, OccurrenceStatus } from "@/types/domain";

/**
 * Pure-logic tests over synthetic logs. The contract tests in
 * `src/server/events/queries.test.ts` and `src/mocks/fixtures.test.ts` cover
 * the same rules against the real fixtures.
 */

const MINUTE_MS = 60_000;
const BASE_MS = Date.UTC(2026, 2, 1, 0, 0);

function occurrence(index: number, overrides: Partial<Occurrence> = {}): Occurrence {
  const start = new Date(BASE_MS + index * MINUTE_MS).toISOString();
  return {
    key: `event-synthetic:${start}`,
    eventId: "event-synthetic",
    clientId: "client-synthetic",
    title: `Task ${index}`,
    description: "",
    start,
    durationMinutes: 15,
    status: "done",
    actor: "Aisha Rahman",
    completedAt: start,
    ...overrides,
  };
}

/** Oldest first, so a function that merely preserves input order fails. */
function syntheticLog(count: number): Occurrence[] {
  return Array.from({ length: count }, (_, index) => occurrence(index));
}

describe("[UI-04][AC-01] queryTaskLog ordering", () => {
  it("[UI-04][AC-01] orders newest first by start, whatever order the rows arrive in", () => {
    const log = syntheticLog(5);
    const expected = [4, 3, 2, 1, 0].map((index) => log[index]?.key);

    const ascending = queryTaskLog(log, {});
    const descending = queryTaskLog([...log].reverse(), {});

    expect(ascending.items.map((item) => item.key)).toEqual(expected);
    expect(descending.items.map((item) => item.key)).toEqual(expected);
  });

  it("[UI-04][AC-01] compares instants, not strings, across UTC offsets", () => {
    // 00:30Z is 30 minutes after 00:00Z (= 11:00+11:00) even though, as text,
    // "…T00:30:00Z" sorts before "…T11:00:00+11:00".
    const newer = occurrence(0, {
      key: "event-a:2026-11-30T00:30:00Z",
      start: "2026-11-30T00:30:00Z",
    });
    const older = occurrence(1, {
      key: "event-b:2026-11-30T11:00:00+11:00",
      start: "2026-11-30T11:00:00+11:00",
    });

    const result = queryTaskLog([older, newer], {});

    expect(result.items.map((item) => item.key)).toEqual([newer.key, older.key]);
  });

  it("[UI-04][AC-01] breaks ties on the same instant by key ascending, even across offsets", () => {
    const b = occurrence(0, { key: "event-b:tie", start: "2026-11-30T11:00:00+11:00" });
    const a = occurrence(1, { key: "event-a:tie", start: "2026-11-30T00:00:00Z" });
    const c = occurrence(2, { key: "event-c:tie", start: "2026-11-30T00:00:00+00:00" });

    expect(queryTaskLog([b, c, a], {}).items.map((item) => item.key)).toEqual([
      "event-a:tie",
      "event-b:tie",
      "event-c:tie",
    ]);
    expect(queryTaskLog([c, a, b], {}).items.map((item) => item.key)).toEqual([
      "event-a:tie",
      "event-b:tie",
      "event-c:tie",
    ]);
  });

  it("[UI-04][AC-01] does not reorder the array it is given", () => {
    const log = syntheticLog(30);
    const before = log.map((item) => item.key);

    queryTaskLog(log, { page: 2 });

    expect(log.map((item) => item.key)).toEqual(before);
  });

  it("[UI-04][AC-01] pages concatenate into one gap-free, duplicate-free newest-first list", () => {
    const log = syntheticLog(45);
    const seen: string[] = [];

    for (let page = 1; page <= 3; page += 1) {
      seen.push(...queryTaskLog(log, { page }).items.map((item) => item.key));
    }

    const expected = [...log].reverse().map((item) => item.key);
    expect(seen).toEqual(expected);
  });
});

describe("[UI-04][AC-01] occurrencesOnDay", () => {
  it("[UI-04][AC-01] returns only the reference day's rows, oldest first, ties by key ascending", () => {
    const rows = [
      occurrence(0, { key: "b", start: "2026-11-30T15:00:00+11:00" }),
      occurrence(1, { key: "a", start: "2026-11-30T09:00:00+11:00" }),
      occurrence(2, { key: "z", start: "2026-11-29T18:00:00+11:00" }),
      occurrence(3, { key: "c", start: "2026-11-30T09:00:00+11:00" }),
      occurrence(4, { key: "y", start: "2026-12-01T09:00:00+11:00" }),
    ];

    const result = occurrencesOnDay(rows, "2026-11-30T09:00:00+11:00");

    expect(result.map((row) => row.key)).toEqual(["a", "c", "b"]);
  });

  it("[UI-04][AC-01] reads the day in Melbourne time, whatever offset the start is written in", () => {
    const rows = [
      occurrence(0, { key: "late-utc", start: "2026-11-29T22:00:00Z" }),
      occurrence(1, { key: "next-day-utc", start: "2026-11-30T13:30:00Z" }),
      occurrence(2, { key: "local", start: "2026-11-30T12:00:00+11:00" }),
    ];

    const result = occurrencesOnDay(rows, "2026-11-30T09:00:00+11:00");

    // 22:00Z on 29 Nov is 09:00 on 30 Nov; 13:30Z on 30 Nov is 00:30 on 1 Dec.
    expect(result.map((row) => row.key)).toEqual(["late-utc", "local"]);
  });

  it("[UI-04][AC-01] does not reorder the array it is given", () => {
    const rows = [
      occurrence(0, { key: "b", start: "2026-11-30T15:00:00+11:00" }),
      occurrence(1, { key: "a", start: "2026-11-30T09:00:00+11:00" }),
    ];

    occurrencesOnDay(rows, "2026-11-30T09:00:00+11:00");

    expect(rows.map((row) => row.key)).toEqual(["b", "a"]);
  });
});

describe("[UI-04][AC-02] queryTaskLog paging", () => {
  it("[UI-04][AC-02] uses a page size of 20", () => {
    expect(TASK_LOG_PAGE_SIZE).toBe(20);
    expect(queryTaskLog(syntheticLog(1), {}).pageSize).toBe(20);
  });

  it.each([
    [0, 0, 0],
    [1, 1, 0],
    [20, 20, 0],
    [21, 20, 1],
    [40, 20, 20],
  ])("[UI-04][AC-02] a log of %i rows: page 1 has %i, page 2 has %i", (rows, page1, page2) => {
    const log = syntheticLog(rows);

    const first = queryTaskLog(log, { page: 1 });
    const second = queryTaskLog(log, { page: 2 });

    expect(first).toMatchObject({ page: 1, pageSize: 20, total: rows });
    expect(first.items).toHaveLength(page1);
    expect(second).toMatchObject({ page: 2, pageSize: 20, total: rows });
    expect(second.items).toHaveLength(page2);
  });

  it("[UI-04][AC-02] a page beyond the last returns no items, the true total and the requested page", () => {
    const log = syntheticLog(40);

    expect(queryTaskLog(log, { page: 3 })).toEqual({ items: [], page: 3, pageSize: 20, total: 40 });
    expect(queryTaskLog(log, { page: 500 })).toEqual({
      items: [],
      page: 500,
      pageSize: 20,
      total: 40,
    });
    expect(queryTaskLog([], { page: 4 })).toEqual({ items: [], page: 4, pageSize: 20, total: 0 });
  });

  it("[UI-04][AC-02] defaults to page 1 when no page is given", () => {
    expect(queryTaskLog(syntheticLog(25), {}).page).toBe(1);
    expect(queryTaskLog(syntheticLog(25)).items).toHaveLength(20);
  });

  it("[UI-04][AC-03] a very large page number returns an empty page rather than throwing", () => {
    const result = queryTaskLog(syntheticLog(25), { page: Number.MAX_SAFE_INTEGER });

    expect(result).toMatchObject({ items: [], total: 25, page: Number.MAX_SAFE_INTEGER });
  });
});

describe("[UI-04][AC-04] queryTaskLog filters", () => {
  function mixedLog(): Occurrence[] {
    const statuses: OccurrenceStatus[] = ["done", "overdue", "planned"];
    const titles = ["Morning medication", "Evening medication", "Physiotherapy", "Weekly weigh-in"];
    return Array.from({ length: 60 }, (_, index) =>
      occurrence(index, {
        title: titles[index % titles.length] ?? "Task",
        status: statuses[index % statuses.length] ?? "done",
      }),
    );
  }

  it("[UI-04][AC-04] q is a trimmed, case-insensitive substring of the title", () => {
    const log = mixedLog();

    const result = queryTaskLog(log, { q: "  MEDICATION " });

    expect(result.total).toBe(30);
    expect(result.items.every((item) => /medication/i.test(item.title))).toBe(true);
  });

  it("[UI-04][AC-04] a blank q does not filter", () => {
    expect(queryTaskLog(mixedLog(), { q: "   " }).total).toBe(60);
  });

  it("[UI-04][AC-04] status is an exact match", () => {
    const result = queryTaskLog(mixedLog(), { status: "overdue" });

    expect(result.total).toBe(20);
    expect(result.items.every((item) => item.status === "overdue")).toBe(true);
  });

  it("[UI-04][AC-04] q and status combine, total counts only rows matching both, and paging runs over the filtered set", () => {
    const log = mixedLog();

    const first = queryTaskLog(log, { q: "physio", status: "planned" });
    const all = log.filter((item) => item.title === "Physiotherapy" && item.status === "planned");

    expect(first.total).toBe(all.length);
    expect(first.items.map((item) => item.key)).toEqual([...all].reverse().map((item) => item.key));
  });

  it("[UI-04][AC-04] a q with no match gives total 0 and no items", () => {
    expect(queryTaskLog(mixedLog(), { q: "Zoe" })).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
  });

  it("[UI-04][AC-04] total is the filtered count on every page, and the last filtered page holds the remainder", () => {
    const log = mixedLog();
    const filtered = log.filter((item) => /medication/i.test(item.title));

    const page1 = queryTaskLog(log, { q: "medication", page: 1 });
    const page2 = queryTaskLog(log, { q: "medication", page: 2 });
    const page3 = queryTaskLog(log, { q: "medication", page: 3 });

    expect([page1.total, page2.total, page3.total]).toEqual([30, 30, 30]);
    expect([page1.items.length, page2.items.length, page3.items.length]).toEqual([20, 10, 0]);
    expect([...page1.items, ...page2.items].map((item) => item.key)).toEqual(
      [...filtered].reverse().map((item) => item.key),
    );
  });
});

describe("[UI-04][AC-05] findOccurrence", () => {
  const margaret = occurrence(1, { clientId: "client-a", key: "event-a:one" });
  const robert = occurrence(2, { clientId: "client-b", key: "event-b:one" });
  const byClient = { "client-a": [margaret], "client-b": [robert] };

  it("[UI-04][AC-05] finds an occurrence in the given client's rows", () => {
    expect(findOccurrence(byClient, "client-a", "event-a:one")).toBe(margaret);
    expect(findOccurrence(byClient, "client-b", "event-b:one")).toBe(robert);
  });

  it("[UI-04][AC-05] never returns another client's row, in either direction", () => {
    expect(findOccurrence(byClient, "client-b", "event-a:one")).toBeUndefined();
    expect(findOccurrence(byClient, "client-a", "event-b:one")).toBeUndefined();
  });

  it("[UI-04][AC-05] returns undefined for an unknown key or an unknown client", () => {
    expect(findOccurrence(byClient, "client-a", "event-a:missing")).toBeUndefined();
    expect(findOccurrence(byClient, "client-z", "event-a:one")).toBeUndefined();
  });

  it("[UI-04][AC-05] treats object-prototype names as unknown clients rather than throwing", () => {
    for (const clientId of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(findOccurrence(byClient, clientId, "event-a:one")).toBeUndefined();
    }
  });
});
