import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Occurrence, TaskLogResult } from "@/types/domain";

const getTaskLog = vi.hoisted(() => vi.fn());

vi.mock("@/server/events/queries", () => ({ getTaskLog }));

import { findOccurrence } from "./find-occurrence";

function occurrence(key: string): Occurrence {
  return {
    key,
    eventId: key.split(":")[0]!,
    clientId: "client-margaret",
    title: key,
    description: "",
    start: "2026-11-30T09:00:00+11:00",
    durationMinutes: 30,
    status: "planned",
  };
}

function page(items: Occurrence[], pageNumber: number, total: number): TaskLogResult {
  return { items, page: pageNumber, pageSize: 2, total };
}

describe("findOccurrence (FD-03: derived from getTaskLog until a single-occurrence contract exists)", () => {
  beforeEach(() => {
    getTaskLog.mockReset();
  });

  it("[FAM-UI-07][AC-04] returns the occurrence with the given key from the first page", async () => {
    getTaskLog.mockResolvedValueOnce(page([occurrence("a:1"), occurrence("b:2")], 1, 2));

    const found = await findOccurrence("client-margaret", "b:2");

    expect(found?.key).toBe("b:2");
    expect(getTaskLog).toHaveBeenCalledExactlyOnceWith("client-margaret", { page: 1 });
  });

  it("[FAM-UI-07][AC-04] keeps paging through the log until it finds the key", async () => {
    getTaskLog
      .mockResolvedValueOnce(page([occurrence("a:1"), occurrence("b:2")], 1, 3))
      .mockResolvedValueOnce(page([occurrence("c:3")], 2, 3));

    const found = await findOccurrence("client-margaret", "c:3");

    expect(found?.key).toBe("c:3");
    expect(getTaskLog).toHaveBeenLastCalledWith("client-margaret", { page: 2 });
  });

  it("[FAM-UI-07][PRD] returns undefined, and stops paging, when no page holds the key", async () => {
    getTaskLog
      .mockResolvedValueOnce(page([occurrence("a:1"), occurrence("b:2")], 1, 3))
      .mockResolvedValueOnce(page([occurrence("c:3")], 2, 3));

    await expect(findOccurrence("client-margaret", "missing:9")).resolves.toBeUndefined();
    expect(getTaskLog).toHaveBeenCalledTimes(2);
  });

  it("[FAM-UI-07][PRD] returns undefined for a client with no occurrences", async () => {
    getTaskLog.mockResolvedValueOnce(page([], 1, 0));

    await expect(findOccurrence("client-robert", "a:1")).resolves.toBeUndefined();
    expect(getTaskLog).toHaveBeenCalledOnce();
  });

  it("[FAM-UI-07][PRD] lets a failing query reject so the route's error state can show", async () => {
    getTaskLog.mockRejectedValueOnce(new Error("query failed"));

    await expect(findOccurrence("client-margaret", "a:1")).rejects.toThrow("query failed");
  });
});
