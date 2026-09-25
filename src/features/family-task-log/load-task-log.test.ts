import { beforeEach, describe, expect, it, vi } from "vitest";

const getTaskLog = vi.hoisted(() => vi.fn());

vi.mock("@/server/events/queries", () => ({ getTaskLog }));

import type { Occurrence } from "@/types/domain";

import { CONTRACT_PAGE_SIZE, fakeTaskLog, makeHistory } from "./fake-task-log";
import { loadTaskLog } from "./load-task-log";
import { MAX_PAGE } from "./task-log-params";

const ID = "client-margaret";

function serve(all: Occurrence[], pageSize = CONTRACT_PAGE_SIZE) {
  getTaskLog.mockReset();
  getTaskLog.mockImplementation(fakeTaskLog(all, pageSize));
}

async function ok(raw: Parameters<typeof loadTaskLog>[1]) {
  const result = await loadTaskLog(ID, raw);
  if (result.kind !== "ok") throw new Error(`expected a page, got a redirect to ${result.href}`);
  return result;
}

describe("loadTaskLog: the whole history, page by page (CHG-005)", () => {
  beforeEach(() => serve(makeHistory(137)));

  it("[FAM-UI-07][AC-05] asks the contract for the requested page and reports total, page, page size and last page", async () => {
    const result = await ok({ page: "2" });

    expect(getTaskLog).toHaveBeenCalledExactlyOnceWith(ID, { page: 2 });
    expect(result).toMatchObject({ total: 137, pageSize: 20, lastPage: 7, params: { page: 2 } });
    expect(result.items).toHaveLength(20);
    expect(result.items[0]?.key).toBe(makeHistory(137)[20]?.key);
  });

  it("[FAM-UI-07][AC-05] reaches the last page of a 537-row history, which holds only the 17 remaining rows", async () => {
    serve(makeHistory(537));

    const first = await ok({});
    const last = await ok({ page: "27" });

    expect(first).toMatchObject({ total: 537, lastPage: 27 });
    expect(first.items).toHaveLength(20);
    expect(last.items).toHaveLength(17);
    expect(last.items.at(-1)?.key).toBe(makeHistory(537).at(-1)?.key);
  });

  it.each([
    [0, 1, 0],
    [1, 1, 1],
    [9, 1, 9],
    [19, 1, 19],
    [20, 1, 20],
    [21, 2, 20],
    [40, 2, 20],
    [41, 3, 20],
  ])(
    "[FAM-UI-07][AC-05] %i rows: %i page(s), the first showing %i rows",
    async (count, lastPage, firstPageRows) => {
      serve(makeHistory(count));

      const result = await ok({});

      expect(result.lastPage).toBe(lastPage);
      expect(result.items).toHaveLength(firstPageRows);
      expect(result.total).toBe(count);
    },
  );

  it("[FAM-UI-07][AC-05] one over a full page puts exactly one row on page 2", async () => {
    serve(makeHistory(21));

    const result = await ok({ page: "2" });

    expect(result.items).toHaveLength(1);
    expect(result.lastPage).toBe(2);
  });

  it("[FAM-UI-07][AC-05] honours the page size the contract reports rather than assuming 20", async () => {
    serve(makeHistory(51), 25);

    const result = await ok({ page: "3" });

    expect(result).toMatchObject({ pageSize: 25, lastPage: 3 });
    expect(result.items).toHaveLength(1);
  });

  it("[FAM-UI-07][AC-05] keeps the order the contract returned and never re-sorts a page", async () => {
    const jumbled = makeHistory(6);
    const order = [3, 0, 5, 1, 4, 2];
    serve(order.map((index) => jumbled[index]!));

    const result = await ok({});

    expect(result.items.map((item) => item.key)).toEqual(order.map((index) => jumbled[index]!.key));
  });
});

describe("loadTaskLog: search and status act across the entire history, on the server (CHG-005)", () => {
  it("[FAM-UI-07][AC-07] forwards q and status together to the contract and shows what it returns", async () => {
    serve(makeHistory(537, { titleAt: { 400: "Needle-in-a-haystack review" } }));

    const result = await ok({ q: "needle", page: "1" });

    expect(getTaskLog).toHaveBeenCalledExactlyOnceWith(ID, { q: "needle", page: 1 });
    expect(result.total).toBe(1);
    expect(result.items[0]?.title).toBe("Needle-in-a-haystack review");
  });

  it("[FAM-UI-07][AC-07] finds an old row (index 400, page 21) that a first-page filter could never reach", async () => {
    const all = makeHistory(537, { titleAt: { 400: "Needle-in-a-haystack review" } });
    serve(all);

    const onScreenWithoutSearch = await ok({});
    const found = await ok({ q: "  NEEDLE " });

    expect(onScreenWithoutSearch.items.map((item) => item.title)).not.toContain(
      "Needle-in-a-haystack review",
    );
    expect(found.items.map((item) => item.title)).toEqual(["Needle-in-a-haystack review"]);
  });

  it("[FAM-UI-07][AC-07] a status filter is answered for the whole history and paged like everything else", async () => {
    serve(makeHistory(537));

    const first = await ok({ status: "overdue" });
    const last = await ok({ status: "overdue", page: String(first.lastPage) });

    expect(getTaskLog).toHaveBeenNthCalledWith(1, ID, { status: "overdue", page: 1 });
    expect(first.items.every((item) => item.status === "overdue")).toBe(true);
    expect(first.total).toBeGreaterThan(100);
    expect(last.items.every((item) => item.status === "overdue")).toBe(true);
    expect((first.lastPage - 1) * 20 + last.items.length).toBe(first.total);
  });

  it("[FAM-UI-07][AC-07] shows an empty result as zero rows on a single page, with the filter kept in the params", async () => {
    serve(makeHistory(537));

    const result = await ok({ q: "Zoe-never-appears", status: "done" });

    expect(result).toMatchObject({
      total: 0,
      lastPage: 1,
      items: [],
      params: { q: "Zoe-never-appears", status: "done", page: 1 },
    });
  });
});

describe("loadTaskLog: invalid and hostile params never reach the contract (AC-06)", () => {
  beforeEach(() => serve(makeHistory(537)));

  it.each(["0", "-3", "abc", "1.5", "1e3", "", "  ", "NaN", "Infinity", "0x10", "+2"])(
    "[FAM-UI-07][AC-06] page=%j is treated as page 1, and the contract is asked for page 1",
    async (page) => {
      const result = await ok({ page });

      expect(getTaskLog).toHaveBeenCalledExactlyOnceWith(ID, { page: 1 });
      expect(result.params.page).toBe(1);
      expect(result.items).toHaveLength(20);
    },
  );

  it("[FAM-UI-07][AC-06] status=bogus becomes all statuses: the contract gets no status at all", async () => {
    const result = await ok({ status: "bogus" });

    expect(getTaskLog).toHaveBeenCalledExactlyOnceWith(ID, { page: 1 });
    expect(Object.keys(getTaskLog.mock.calls[0]![1])).not.toContain("status");
    expect(result.params.status).toBeUndefined();
  });

  it("[FAM-UI-07][AC-06] a 5,000 character q reaches the contract capped at 200 characters", async () => {
    const result = await ok({ q: "a".repeat(5000) });

    expect(getTaskLog.mock.calls[0]![1].q).toHaveLength(200);
    expect(result.params.q).toHaveLength(200);
  });

  it("[FAM-UI-07][AC-06] a page past the end redirects to the last page, keeping q and status", async () => {
    const result = await loadTaskLog(ID, { status: "done", page: "99999" });

    expect(result.kind).toBe("redirect");
    const last = Math.ceil((await ok({ status: "done" })).total / 20);
    expect(result).toEqual({
      kind: "redirect",
      href: `/family/client-margaret/tasks?status=done&page=${last}`,
    });
  });

  it("[FAM-UI-07][AC-06] page 28 of 27 goes to page 27; the last page itself is not redirected", async () => {
    expect(await loadTaskLog(ID, { page: "28" })).toEqual({
      kind: "redirect",
      href: "/family/client-margaret/tasks?page=27",
    });
    expect((await loadTaskLog(ID, { page: "27" })).kind).toBe("ok");
  });

  it("[FAM-UI-07][AC-06] a page past the end of an empty result redirects to the plain route", async () => {
    serve(makeHistory(0));

    expect(await loadTaskLog(ID, { page: "5" })).toEqual({
      kind: "redirect",
      href: "/family/client-margaret/tasks",
    });
  });

  it("[FAM-UI-07][AC-06] a page number too big to be real is clamped before the contract sees it, then redirected", async () => {
    const result = await loadTaskLog(ID, { page: "9".repeat(400) });

    expect(getTaskLog).toHaveBeenCalledExactlyOnceWith(ID, { page: MAX_PAGE });
    expect(result).toEqual({ kind: "redirect", href: "/family/client-margaret/tasks?page=27" });
  });

  it("[FAM-UI-07][AC-06] repeated params use the first value", async () => {
    await ok({ q: ["physio", "walk"], status: ["done", "overdue"], page: ["2", "9"] });

    expect(getTaskLog).toHaveBeenCalledExactlyOnceWith(ID, {
      q: "physio",
      status: "done",
      page: 2,
    });
  });

  it("[FAM-UI-07][AC-06] undefined search params (as a test or a bare route passes them) mean the first unfiltered page", async () => {
    const result = await ok(undefined);

    expect(getTaskLog).toHaveBeenCalledExactlyOnceWith(ID, { page: 1 });
    expect(result.params).toEqual({ q: "", status: undefined, page: 1 });
  });
});

describe("loadTaskLog: failures and odd contract answers", () => {
  it("[FAM-UI-07][PRD] lets a failing contract reject so the route's error state can show", async () => {
    getTaskLog.mockReset();
    getTaskLog.mockRejectedValueOnce(new Error("query failed"));

    await expect(loadTaskLog(ID, {})).rejects.toThrow("query failed");
  });

  it("[FAM-UI-07][PRD] survives a contract that reports a page size of 0 without dividing by zero", async () => {
    getTaskLog.mockReset();
    getTaskLog.mockResolvedValueOnce({ items: makeHistory(3), page: 1, pageSize: 0, total: 3 });

    const result = await ok({});

    expect(result.lastPage).toBe(1);
    expect(result.items).toHaveLength(3);
  });
});
