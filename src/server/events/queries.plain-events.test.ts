// @vitest-environment node
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { ZodError } from "zod";

import { MARGARET_CLIENT_ID, REFERENCE_DATE } from "@/mocks/fixtures";
import { melbourneDateKey } from "@/mocks/melbourne-time";
import { getOccurrence, getTaskLog, getTodayOccurrences } from "@/server/events/queries";
import { isPlainEvent, OccurrenceStatusSchema, TASK_LOG_PAGE_SIZE } from "@/types/domain";
import type {
  AnyOccurrence,
  Occurrence,
  OccurrenceTypeFilter,
  TaskLogQuery,
  TaskLogResult,
} from "@/types/domain";

/**
 * Contract tests for the plain-event options (UI-05, CHG-009, FD-01, FD-03):
 * they call the `src/server/events` functions the screens call, with
 * DATA_SOURCE=mock.
 */

const ROBERT_CLIENT_ID = "client-robert";
const WALK_KEY = "event-margaret-walk:2026-11-30T14:00:00+11:00";

async function readAll(clientId: string, query: TaskLogQuery = {}): Promise<AnyOccurrence[]> {
  const rows: AnyOccurrence[] = [];
  for (let page = 1; page <= 200; page += 1) {
    const result = await getTaskLog(clientId, { type: "all", ...query, page });
    if (result.items.length === 0) return rows;
    rows.push(...result.items);
  }
  throw new Error("readAll: more than 200 pages, the log is not terminating");
}

async function readAllDefault(clientId: string): Promise<Occurrence[]> {
  const rows: Occurrence[] = [];
  for (let page = 1; page <= 200; page += 1) {
    const result = await getTaskLog(clientId, { page });
    if (result.items.length === 0) return rows;
    rows.push(...result.items);
  }
  throw new Error("readAllDefault: more than 200 pages, the log is not terminating");
}

function hasNoTaskFields(row: AnyOccurrence): boolean {
  return !("status" in row) && !("actor" in row) && !("completedAt" in row);
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[UI-05][AC-03] getTaskLog type filter", () => {
  it("[UI-05][AC-03] type all returns tasks and plain events newest first, strictly ordered across pages", async () => {
    const rows = await readAll(MARGARET_CLIENT_ID);
    const first = await getTaskLog(MARGARET_CLIENT_ID, { type: "all" });

    expect(rows.some(isPlainEvent)).toBe(true);
    expect(rows.some((row) => !isPlainEvent(row))).toBe(true);
    expect(first.total).toBe(rows.length);
    expect(first.pageSize).toBe(TASK_LOG_PAGE_SIZE);
    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1] as AnyOccurrence;
      const current = rows[index] as AnyOccurrence;
      const a = Date.parse(previous.start);
      const b = Date.parse(current.start);
      expect(a > b || (a === b && previous.key < current.key)).toBe(true);
    }
  });

  it("[UI-05][AC-03] type all is tasks plus plain events, no more and no less", async () => {
    const all = await readAll(MARGARET_CLIENT_ID);
    const tasks = await readAll(MARGARET_CLIENT_ID, { type: "tasks" });
    const events = await readAll(MARGARET_CLIENT_ID, { type: "events" });

    expect(all.length).toBe(tasks.length + events.length);
    expect(new Set(all.map((row) => row.key))).toEqual(
      new Set([...tasks, ...events].map((row) => row.key)),
    );
  });

  it("[UI-05][AC-03] type tasks has no plain events; type events has only plain events, none with a status", async () => {
    const tasks = await readAll(MARGARET_CLIENT_ID, { type: "tasks" });
    const events = await readAll(MARGARET_CLIENT_ID, { type: "events" });

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((row) => !isPlainEvent(row))).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    expect(events.every(isPlainEvent)).toBe(true);
    expect(events.every(hasNoTaskFields)).toBe(true);
  });

  it("[UI-05][AC-03] any status filter returns tasks only; with type events it is empty with total 0", async () => {
    for (const status of OccurrenceStatusSchema.options) {
      for (const type of [undefined, "all", "tasks"] as const) {
        const rows = await readAll(MARGARET_CLIENT_ID, { status, ...(type ? { type } : {}) });
        expect(rows.every((row) => !isPlainEvent(row) && row.status === status)).toBe(true);
      }
      const events = await getTaskLog(MARGARET_CLIENT_ID, { type: "events", status });
      expect(events).toEqual({ items: [], page: 1, pageSize: TASK_LOG_PAGE_SIZE, total: 0 });
    }
  });

  it("[UI-05][AC-03] q combines with type, and total counts rows after every filter", async () => {
    const walks = await getTaskLog(MARGARET_CLIENT_ID, { type: "all", q: "  WALK " });
    expect(walks.total).toBeGreaterThan(0);
    expect(walks.items.every(isPlainEvent)).toBe(true);

    const noWalkTasks = await getTaskLog(MARGARET_CLIENT_ID, { type: "tasks", q: "walk" });
    expect(noWalkTasks.total).toBe(0);

    const physioEvents = await getTaskLog(MARGARET_CLIENT_ID, { type: "events", q: "physio" });
    expect(physioEvents.total).toBe(0);
  });

  it("[UI-05][AC-03] an unknown type rejects with a ZodError", async () => {
    await expect(
      getTaskLog(MARGARET_CLIENT_ID, { type: "bogus" as OccurrenceTypeFilter }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("[UI-05][AC-03] a read with a type option is typed as AnyOccurrence; without one it stays Occurrence", async () => {
    const typed = await getTaskLog(MARGARET_CLIENT_ID, { type: "all" });
    const plain = await getTaskLog(MARGARET_CLIENT_ID, {});
    expectTypeOf(typed).toEqualTypeOf<TaskLogResult<AnyOccurrence>>();
    expectTypeOf(plain).toEqualTypeOf<TaskLogResult>();
  });
});

describe("[UI-05][AC-04] getOccurrence and getTodayOccurrences with plain events", () => {
  it("[UI-05][AC-04] getOccurrence with type all returns a plain event with no status, actor or completion time, assignee kept", async () => {
    const walk = await getOccurrence(MARGARET_CLIENT_ID, WALK_KEY, { type: "all" });

    expect(walk).toBeDefined();
    expect(walk && isPlainEvent(walk)).toBe(true);
    expect(walk && hasNoTaskFields(walk)).toBe(true);
    expect(walk?.assignee).toBe("Aisha Rahman");
    expect(walk?.title).toBe("Afternoon walk");
  });

  it("[UI-05][AC-04] without the option a plain event's key is not found (FD-03)", async () => {
    expect(await getOccurrence(MARGARET_CLIENT_ID, WALK_KEY)).toBeUndefined();
  });

  it("[UI-05][AC-04] another client's plain-event key is undefined", async () => {
    expect(await getOccurrence(ROBERT_CLIENT_ID, WALK_KEY, { type: "all" })).toBeUndefined();
  });

  it("[UI-05][AC-04] getOccurrence with type all still returns tasks", async () => {
    const key = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";
    const task = await getOccurrence(MARGARET_CLIENT_ID, key, { type: "all" });

    expect(task && !isPlainEvent(task) ? task.status : undefined).toBe("done");
  });

  it("[UI-05][AC-04] getTodayOccurrences with type all returns the day's tasks and plain events, oldest first, Margaret only", async () => {
    const rows = await getTodayOccurrences(MARGARET_CLIENT_ID, { type: "all" });
    const day = melbourneDateKey(REFERENCE_DATE);

    expect(rows.map((row) => row.title)).toEqual([
      "Morning medication",
      "Physiotherapy",
      "Afternoon walk",
      "Afternoon check-in",
    ]);
    expect(rows.every((row) => row.clientId === MARGARET_CLIENT_ID)).toBe(true);
    expect(rows.every((row) => melbourneDateKey(row.start) === day)).toBe(true);
    expect(rows.filter(isPlainEvent).map((row) => row.key)).toEqual([WALK_KEY]);
  });

  it("[UI-05][AC-04] getTodayOccurrences with type events returns only plain events; tasks only the tasks", async () => {
    const events = await getTodayOccurrences(MARGARET_CLIENT_ID, { type: "events" });
    const tasks = await getTodayOccurrences(MARGARET_CLIENT_ID, { type: "tasks" });

    expect(events.map((row) => row.key)).toEqual([WALK_KEY]);
    expect(tasks).toEqual(await getTodayOccurrences(MARGARET_CLIENT_ID));
  });

  it("[UI-05][AC-04] the typed reads return AnyOccurrence; the plain reads keep Occurrence", async () => {
    expectTypeOf(await getTodayOccurrences(MARGARET_CLIENT_ID, { type: "all" })).toEqualTypeOf<
      AnyOccurrence[]
    >();
    expectTypeOf(await getTodayOccurrences(MARGARET_CLIENT_ID)).toEqualTypeOf<Occurrence[]>();
    expectTypeOf(await getOccurrence(MARGARET_CLIENT_ID, WALK_KEY, { type: "all" })).toEqualTypeOf<
      AnyOccurrence | undefined
    >();
    expectTypeOf(await getOccurrence(MARGARET_CLIENT_ID, WALK_KEY)).toEqualTypeOf<
      Occurrence | undefined
    >();
  });
});

describe("[UI-05][AC-06] callers without the new options are unchanged", () => {
  it("[UI-05][AC-06] Margaret's log still totals 137 task rows, none of them plain events", async () => {
    const first = await getTaskLog(MARGARET_CLIENT_ID);
    const rows = await readAllDefault(MARGARET_CLIENT_ID);

    expect(first.total).toBe(137);
    expect(rows).toHaveLength(137);
    expect(rows.every((row) => !isPlainEvent(row))).toBe(true);
  });

  it("[UI-05][AC-06] type tasks returns exactly what no type returns", async () => {
    for (const page of [1, 7, 8]) {
      expect(await getTaskLog(MARGARET_CLIENT_ID, { type: "tasks", page })).toEqual(
        await getTaskLog(MARGARET_CLIENT_ID, { page }),
      );
    }
  });

  it("[UI-05][AC-06] the reference day without options is still the three design tasks", async () => {
    const rows = await getTodayOccurrences(MARGARET_CLIENT_ID);

    expect(rows.map((row) => [row.title, row.status])).toEqual([
      ["Morning medication", "done"],
      ["Physiotherapy", "planned"],
      ["Afternoon check-in", "planned"],
    ]);
  });
});
