import { describe, expect, it } from "vitest";

import { parseTaskLogParams } from "./task-log-params";
import { decodeOccurrenceKey, editEventHref, taskDetailHref, taskLogHref } from "./task-routes";

const KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";

describe("task routes (ARCHITECTURE.md §3.1)", () => {
  it("[FAM-UI-07][PRD] the Task log lives at /family/[clientId]/tasks", () => {
    expect(taskLogHref("client-margaret")).toBe("/family/client-margaret/tasks");
  });

  it("[FAM-UI-07][PRD] a Task detail lives at /family/[clientId]/tasks/[occurrenceKey], with the key URL-encoded", () => {
    expect(taskDetailHref("client-margaret", KEY)).toBe(
      "/family/client-margaret/tasks/event-margaret-morning-meds%3A2026-11-30T09%3A00%3A00%2B11%3A00",
    );
  });

  it("[FAM-UI-07][PRD] the Edit link targets the edit-event route for the occurrence's event", () => {
    expect(editEventHref("client-margaret", "event-margaret-morning-meds")).toBe(
      "/family/client-margaret/events/event-margaret-morning-meds/edit",
    );
  });
});

describe("decodeOccurrenceKey", () => {
  it("[FAM-UI-07][PRD] round-trips an encoded key back to the contract key", () => {
    const encoded = taskDetailHref("client-margaret", KEY).split("/").pop() ?? "";

    expect(decodeOccurrenceKey(encoded)).toBe(KEY);
  });

  it("[FAM-UI-07][PRD] leaves a key that is already decoded unchanged (params may arrive either way)", () => {
    expect(decodeOccurrenceKey(KEY)).toBe(KEY);
  });

  it("[FAM-UI-07][PRD] returns a malformed percent sequence as given instead of throwing", () => {
    expect(decodeOccurrenceKey("100%")).toBe("100%");
  });
});

describe("the shared URL contract: /family/{clientId}/tasks?q=&status=&page=", () => {
  const ID = "client-margaret";

  it("[FAM-UI-07][AC-07] carries q, status and page in that order", () => {
    expect(taskLogHref(ID, { q: "physio", status: "done", page: 3 })).toBe(
      "/family/client-margaret/tasks?q=physio&status=done&page=3",
    );
  });

  it("[FAM-UI-07][AC-07] leaves out anything that is a default, so an unfiltered first page is the plain route", () => {
    expect(taskLogHref(ID, { q: "", status: undefined, page: 1 })).toBe(
      "/family/client-margaret/tasks",
    );
    expect(taskLogHref(ID, { page: 1 })).toBe("/family/client-margaret/tasks");
    expect(taskLogHref(ID, { status: "overdue" })).toBe(
      "/family/client-margaret/tasks?status=overdue",
    );
    expect(taskLogHref(ID, { page: 2 })).toBe("/family/client-margaret/tasks?page=2");
  });

  it("[FAM-UI-07][AC-08] a Task detail carries the same three params after the encoded key", () => {
    expect(taskDetailHref(ID, KEY, { q: "physio", status: "done", page: 3 })).toBe(
      "/family/client-margaret/tasks/event-margaret-morning-meds%3A2026-11-30T09%3A00%3A00%2B11%3A00?q=physio&status=done&page=3",
    );
    expect(taskDetailHref(ID, KEY, { page: 1 })).toBe(taskDetailHref(ID, KEY));
  });

  it("[FAM-UI-07][AC-08] builds hrefs only from validated params, whatever a caller hands in", () => {
    expect(taskLogHref(ID, { q: "x".repeat(5000) }).split("q=")[1]).toHaveLength(200);
    expect(taskLogHref(ID, { page: -3 })).toBe("/family/client-margaret/tasks");
    expect(taskLogHref(ID, { page: 0 })).toBe("/family/client-margaret/tasks");
    expect(taskLogHref(ID, { page: 1.5 })).toBe("/family/client-margaret/tasks");
    expect(taskLogHref(ID, { page: Number.NaN })).toBe("/family/client-margaret/tasks");
    expect(taskLogHref(ID, { status: "bogus" as never })).toBe("/family/client-margaret/tasks");
    expect(taskLogHref(ID, { q: "  spaced  " })).toBe("/family/client-margaret/tasks?q=spaced");
  });

  it.each([
    "a & b=c#d",
    "100%",
    "50% off?",
    "<script>alert(1)</script>",
    '"quoted"',
    "a+b",
    "日本語",
    "😀 emoji",
    "Zoë",
    "x y  z",
  ])("[FAM-UI-07][AC-08] round-trips q=%j through the URL unchanged", (q) => {
    const href = taskLogHref(ID, { q, status: "done", page: 2 });
    const search = new URLSearchParams(href.split("?")[1]);

    expect(
      parseTaskLogParams({
        q: search.get("q") ?? undefined,
        status: search.get("status") ?? undefined,
        page: search.get("page") ?? undefined,
      }),
    ).toEqual({
      q: parseTaskLogParams({ q }).q,
      status: "done",
      page: 2,
    });
  });

  it.each(["a/b?c", "//evil.example", "client margaret", "https://evil.example", "\\evil"])(
    "[FAM-UI-07][AC-08] a hostile clientId %j stays one encoded path segment: no open redirect",
    (clientId) => {
      for (const href of [
        taskLogHref(clientId, { q: "x" }),
        taskDetailHref(clientId, KEY, { q: "x" }),
      ]) {
        expect(href.startsWith("/family/")).toBe(true);
        expect(href.split("?")[0]!.split("/").filter(Boolean)[1]).toBe(
          encodeURIComponent(clientId),
        );
        expect(href).not.toMatch(/^\/\//);
      }
    },
  );
});
