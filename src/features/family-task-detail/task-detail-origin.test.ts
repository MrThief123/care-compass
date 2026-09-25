import { describe, expect, it } from "vitest";

import type { CalendarParams } from "@/features/family-calendar/calendar-params";
import { taskDetailHref } from "@/features/family-task-log/task-routes";

import {
  backLinkFor,
  parseTaskDetailOrigin,
  taskDetailHrefFrom,
  type TaskDetailOrigin,
} from "./task-detail-origin";

/*
 * CHG-014: Task detail's Back returns to where the task was opened from. The
 * origin travels as `?from=<tasks|calendar|home>` plus that screen's own
 * validated params; the Back href is rebuilt only from a whitelisted origin
 * and re-validated params, never from a URL or path read from the query.
 */

const ID = "client-margaret";
const KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";
const TODAY = "2026-11-30";
const PATH = taskDetailHref(ID, KEY);

type Raw = Record<string, string | string[] | undefined>;

/** The query of an href as Next hands it to a page (`searchParams`). */
function searchOf(href: string): Raw {
  const raw: Raw = {};
  new URLSearchParams(href.split("?")[1] ?? "").forEach((value, key) => {
    const previous = raw[key];
    raw[key] =
      previous === undefined
        ? value
        : Array.isArray(previous)
          ? [...previous, value]
          : [previous, value];
  });
  return raw;
}

/** What Task detail shows as Back for a link built by `taskDetailHrefFrom`. */
function backFor(origin: TaskDetailOrigin) {
  const href = taskDetailHrefFrom(ID, KEY, origin);
  return backLinkFor(ID, parseTaskDetailOrigin(searchOf(href), TODAY));
}

const WEEK: CalendarParams = { view: "week", date: "2026-12-02", month: "2026-12" };
const MONTH: CalendarParams = { view: "month", date: "2026-11-29", month: "2026-12" };
const DAY: CalendarParams = { view: "day", date: "2026-12-04", month: "2026-12" };

describe("[FAM-UI-07] Task detail origin: links carry where the task was opened from (CHG-014)", () => {
  it("[FAM-UI-07][AC-10] a Calendar link carries from=calendar plus the calendar's view and selected day", () => {
    expect(taskDetailHrefFrom(ID, KEY, { from: "calendar", view: WEEK })).toBe(
      `${PATH}?from=calendar&view=week&date=2026-12-02`,
    );
    expect(taskDetailHrefFrom(ID, KEY, { from: "calendar", view: MONTH })).toBe(
      `${PATH}?from=calendar&view=month&date=2026-11-29&month=2026-12`,
    );
  });

  it("[FAM-UI-07][AC-10] a Home link carries from=home and nothing else", () => {
    expect(taskDetailHrefFrom(ID, KEY, { from: "home" })).toBe(`${PATH}?from=home`);
  });

  it("[FAM-UI-07][AC-10] a Task log link carries from=tasks plus the validated q, status and page", () => {
    expect(
      taskDetailHrefFrom(ID, KEY, {
        from: "tasks",
        view: { q: "physio", status: "done", page: 3 },
      }),
    ).toBe(`${PATH}?from=tasks&q=physio&status=done&page=3`);
    expect(taskDetailHrefFrom(ID, KEY, { from: "tasks", view: { q: "", page: 1 } })).toBe(
      `${PATH}?from=tasks`,
    );
  });
});

describe("[FAM-UI-07] Task detail origin: Back returns to the exact origin view (CHG-014)", () => {
  it.each([
    [WEEK, "/family/client-margaret/calendar?view=week&date=2026-12-02"],
    [MONTH, "/family/client-margaret/calendar?view=month&date=2026-11-29&month=2026-12"],
    [DAY, "/family/client-margaret/calendar?view=day&date=2026-12-04"],
  ])(
    "[FAM-UI-07][AC-10] opened from the Calendar (%j), Back is 'Back to Calendar' on that view and day",
    (view, href) => {
      expect(backFor({ from: "calendar", view })).toEqual({ label: "Back to Calendar", href });
    },
  );

  it("[FAM-UI-07][AC-10] opened from Home, Back is 'Back to Home'", () => {
    expect(backFor({ from: "home" })).toEqual({
      label: "Back to Home",
      href: "/family/client-margaret/home",
    });
  });

  it("[FAM-UI-07][AC-10] opened from the Task log, Back is 'Back to Task log' on the same q, status and page", () => {
    expect(backFor({ from: "tasks", view: { q: "a & b", status: "overdue", page: 2 } })).toEqual({
      label: "Back to Task log",
      href: "/family/client-margaret/tasks?q=a+%26+b&status=overdue&page=2",
    });
  });

  it("[FAM-UI-07][AC-10] with no origin at all, Back is today's 'Back to Task log', keeping valid Task log params", () => {
    expect(backLinkFor(ID, parseTaskDetailOrigin({}, TODAY))).toEqual({
      label: "Back to Task log",
      href: "/family/client-margaret/tasks",
    });
    expect(backLinkFor(ID, parseTaskDetailOrigin({ q: "meds", page: "2" }, TODAY))).toEqual({
      label: "Back to Task log",
      href: "/family/client-margaret/tasks?q=meds&page=2",
    });
    expect(backLinkFor(ID)).toEqual({
      label: "Back to Task log",
      href: "/family/client-margaret/tasks",
    });
  });
});

describe("[FAM-UI-07] Task detail origin: invalid and hostile values (CHG-014)", () => {
  it.each([
    "bogus",
    "",
    "Calendar",
    " calendar",
    "calendar/",
    "https://evil.example",
    "//evil.example/family/client-margaret/home",
    "/family/client-margaret/calendar",
    "javascript:alert(1)",
    "../../home",
    "__proto__",
    "home\u0000",
    "x".repeat(5000),
  ])(
    "[FAM-UI-07][AC-11] an unknown or hostile from=%j falls back to 'Back to Task log' and is never echoed",
    (from) => {
      const back = backLinkFor(
        ID,
        parseTaskDetailOrigin({ from, q: "meds", status: "done" }, TODAY),
      );

      expect(back).toEqual({
        label: "Back to Task log",
        href: "/family/client-margaret/tasks?q=meds&status=done",
      });
      expect(back.href).not.toContain("evil");
      const url = new URL(back.href, "https://app.example");
      expect(url.origin).toBe("https://app.example");
    },
  );

  it("[FAM-UI-07][AC-11] a repeated from uses its first value, like the Task log's params", () => {
    expect(parseTaskDetailOrigin({ from: ["home", "calendar"] }, TODAY)).toEqual({ from: "home" });
    expect(parseTaskDetailOrigin({ from: ["evil", "home"] }, TODAY).from).toBe("tasks");
  });

  it("[FAM-UI-07][AC-11] junk calendar params fall back to the calendar's defaults (week, today)", () => {
    expect(
      backLinkFor(
        ID,
        parseTaskDetailOrigin(
          {
            from: "calendar",
            view: "https://evil.example",
            date: "2026-02-30",
            month: "//evil",
          },
          TODAY,
        ),
      ),
    ).toEqual({
      label: "Back to Calendar",
      href: "/family/client-margaret/calendar?view=week&date=2026-11-30",
    });
    expect(
      backLinkFor(
        ID,
        parseTaskDetailOrigin({ from: "calendar", view: "month", month: "9999-99" }, TODAY),
      ),
    ).toEqual({
      label: "Back to Calendar",
      href: "/family/client-margaret/calendar?view=month&date=2026-11-30&month=2026-12",
    });
  });

  it("[FAM-UI-07][AC-11] from=home ignores any other params: Back is always the plain Home", () => {
    expect(
      backLinkFor(
        ID,
        parseTaskDetailOrigin(
          { from: "home", q: "x", view: "day", next: "https://evil.example" },
          TODAY,
        ),
      ),
    ).toEqual({ label: "Back to Home", href: "/family/client-margaret/home" });
  });

  it("[FAM-UI-07][AC-11] from=calendar ignores Task log params, and from=tasks ignores calendar params", () => {
    expect(parseTaskDetailOrigin({ from: "calendar", q: "x", date: "2026-12-01" }, TODAY)).toEqual({
      from: "calendar",
      view: { view: "week", date: "2026-12-01", month: "2026-12" },
    });
    expect(
      backLinkFor(ID, parseTaskDetailOrigin({ from: "tasks", view: "day", q: "x" }, TODAY)).href,
    ).toBe("/family/client-margaret/tasks?q=x");
  });

  it.each(["a/b?c", "//evil.example", "https://evil.example", "\\evil"])(
    "[FAM-UI-07][AC-11] a hostile clientId %j stays one encoded path segment in every Back href",
    (clientId) => {
      for (const origin of [
        { from: "home" },
        { from: "calendar", view: WEEK },
        { from: "tasks", view: { q: "x" } },
      ] as TaskDetailOrigin[]) {
        const { href } = backLinkFor(clientId, origin);
        expect(href.startsWith("/family/")).toBe(true);
        expect(href.split("?")[0]!.split("/").filter(Boolean)[1]).toBe(
          encodeURIComponent(clientId),
        );
      }
    },
  );
});
