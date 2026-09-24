import { describe, expect, it } from "vitest";

import type { CalendarParams } from "@/features/family-calendar/calendar-params";
import {
  backLinkFor,
  parseTaskDetailOrigin,
  taskDetailHrefFrom,
  type TaskDetailOrigin,
} from "@/features/family-task-detail/task-detail-origin";
import { editEventHref } from "@/features/family-task-log/task-routes";

import {
  addEventHrefFrom,
  addEventReturnHref,
  editEventHrefFrom,
  editEventReturnHref,
} from "./event-form-return";

/*
 * CHG-015: Task detail's 'Edit event' passes the occurrence being viewed and
 * Task detail's own origin (CHG-014). Save and Cancel on Edit event go back to
 * that occurrence's Task detail with the origin kept, and Add event's go to
 * Home. Every href is rebuilt from whitelisted, re-validated values only.
 */

const ID = "client-margaret";
const EVENT = "event-margaret-physio";
const KEY = "event-margaret-physio:2026-11-28T11:30:00+11:00";
const ENCODED_KEY = "event-margaret-physio%3A2026-11-28T11%3A30%3A00%2B11%3A00";
const TODAY = "2026-11-30";
const EDIT = editEventHref(ID, EVENT);

type Raw = Record<string, string | string[] | undefined>;

/** The query of an href as Next hands it to a page (`searchParams`). */
function searchOf(href: string): Raw {
  const raw: Raw = {};
  new URLSearchParams(href.split("?")[1] ?? "").forEach((value, key) => {
    raw[key] = value;
  });
  return raw;
}

const WEEK: CalendarParams = { view: "week", date: "2026-12-03", month: "2026-12" };
const MONTH: CalendarParams = { view: "month", date: "2026-11-28", month: "2026-11" };

const ORIGINS: TaskDetailOrigin[] = [
  { from: "calendar", view: WEEK },
  { from: "calendar", view: MONTH },
  { from: "calendar", view: { view: "day", date: "2026-12-04", month: "2026-12" } },
  { from: "home" },
  { from: "tasks", view: { q: "physio", status: "done", page: 2 } },
  { from: "tasks", view: {} },
];

describe("[FAM-UI-03] Edit event link: the occurrence being viewed and Task detail's origin (CHG-015)", () => {
  it("[FAM-UI-03][AC-07] carries the occurrence key, encoded, and a Calendar origin with its view", () => {
    expect(
      editEventHrefFrom(ID, { eventId: EVENT, key: KEY }, { from: "calendar", view: MONTH }),
    ).toBe(
      `${EDIT}?occurrence=${ENCODED_KEY}&from=calendar&view=month&date=2026-11-28&month=2026-11`,
    );
  });

  it("[FAM-UI-03][AC-07] carries a Home origin, and a Task log origin with its q / status / page", () => {
    expect(editEventHrefFrom(ID, { eventId: EVENT, key: KEY }, { from: "home" })).toBe(
      `${EDIT}?occurrence=${ENCODED_KEY}&from=home`,
    );
    expect(
      editEventHrefFrom(
        ID,
        { eventId: EVENT, key: KEY },
        { from: "tasks", view: { q: "physio", status: "done", page: 2 } },
      ),
    ).toBe(`${EDIT}?occurrence=${ENCODED_KEY}&from=tasks&q=physio&status=done&page=2`);
    expect(editEventHrefFrom(ID, { eventId: EVENT, key: KEY }, { from: "tasks" })).toBe(
      `${EDIT}?occurrence=${ENCODED_KEY}&from=tasks`,
    );
  });

  it("[FAM-UI-03][AC-07] with no origin it carries only the occurrence", () => {
    expect(editEventHrefFrom(ID, { eventId: EVENT, key: KEY })).toBe(
      `${EDIT}?occurrence=${ENCODED_KEY}`,
    );
  });

  it("[FAM-UI-03][AC-07] the occurrence and origin survive the round trip link → page params", () => {
    for (const origin of ORIGINS) {
      const raw = searchOf(editEventHrefFrom(ID, { eventId: EVENT, key: KEY }, origin));
      expect(raw.occurrence).toBe(KEY);
      expect(backLinkFor(ID, parseTaskDetailOrigin(raw, TODAY))).toEqual(backLinkFor(ID, origin));
    }
  });

  it("[FAM-UI-03][AC-07] a hostile client id or event id stays inside its own path segment", () => {
    const href = editEventHrefFrom(
      "../../x?y=1",
      { eventId: "a/b?c#d", key: KEY },
      { from: "home" },
    );
    expect(href.startsWith("/family/..%2F..%2Fx%3Fy%3D1/events/a%2Fb%3Fc%23d/edit?")).toBe(true);
  });
});

describe("[FAM-UI-03] Where Save event and Cancel go (CHG-015)", () => {
  it("[FAM-UI-03][AC-08] Edit event with a valid occurrence returns to that occurrence's Task detail, origin kept", () => {
    for (const origin of ORIGINS) {
      expect(editEventReturnHref(ID, KEY, origin)).toBe(taskDetailHrefFrom(ID, KEY, origin));
    }
  });

  it("[FAM-UI-03][AC-08] from there, Task detail's Back still reaches the screen it was first opened from", () => {
    for (const origin of ORIGINS) {
      const detail = editEventReturnHref(ID, KEY, origin);
      expect(backLinkFor(ID, parseTaskDetailOrigin(searchOf(detail), TODAY))).toEqual(
        backLinkFor(ID, origin),
      );
    }
  });

  it("[FAM-UI-03][AC-08] Edit event with no valid occurrence returns to the origin screen itself", () => {
    expect(editEventReturnHref(ID, undefined, { from: "calendar", view: MONTH })).toBe(
      "/family/client-margaret/calendar?view=month&date=2026-11-28&month=2026-11",
    );
    expect(editEventReturnHref(ID, undefined, { from: "home" })).toBe(
      "/family/client-margaret/home",
    );
    expect(
      editEventReturnHref(ID, undefined, { from: "tasks", view: { q: "physio", page: 2 } }),
    ).toBe("/family/client-margaret/tasks?q=physio&page=2");
  });

  it("[FAM-UI-03][AC-08] with neither an occurrence nor an origin it returns to the Task log", () => {
    expect(editEventReturnHref(ID, undefined, { from: "tasks", view: {} })).toBe(
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-03][AC-09] Add event returns to Family Home, its only opener", () => {
    expect(addEventReturnHref(ID)).toBe("/family/client-margaret/home");
    expect(addEventReturnHref("a/b?c")).toBe("/family/a%2Fb%3Fc/home");
  });
});

describe("[FAM-UI-03] Add event opened from the Calendar (CHG-017)", () => {
  const NEW = "/family/client-margaret/events/new";
  const DAY: CalendarParams = { view: "day", date: "2026-12-04", month: "2026-12" };

  it("[FAM-UI-03][AC-10] the Calendar's Enter event link carries its view, selected day and month", () => {
    expect(addEventHrefFrom(ID, { from: "calendar", view: WEEK })).toBe(
      `${NEW}?from=calendar&view=week&date=2026-12-03`,
    );
    expect(addEventHrefFrom(ID, { from: "calendar", view: MONTH })).toBe(
      `${NEW}?from=calendar&view=month&date=2026-11-28&month=2026-11`,
    );
    expect(addEventHrefFrom(ID, { from: "calendar", view: DAY })).toBe(
      `${NEW}?from=calendar&view=day&date=2026-12-04`,
    );
    expect(
      addEventHrefFrom("a/b?c", { from: "calendar", view: WEEK }).startsWith(
        "/family/a%2Fb%3Fc/events/new?",
      ),
    ).toBe(true);
  });

  it("[FAM-UI-03][AC-10] Save event and Cancel return to that Calendar view", () => {
    for (const view of [WEEK, MONTH, DAY]) {
      expect(addEventReturnHref(ID, { from: "calendar", view })).toBe(
        backLinkFor(ID, { from: "calendar", view }).href,
      );
    }
    expect(addEventReturnHref(ID, { from: "calendar", view: MONTH })).toBe(
      "/family/client-margaret/calendar?view=month&date=2026-11-28&month=2026-11",
    );
  });

  it("[FAM-UI-03][AC-10] the origin survives the round trip link → page params", () => {
    for (const view of [WEEK, MONTH, DAY]) {
      const raw = searchOf(addEventHrefFrom(ID, { from: "calendar", view }));
      expect(addEventReturnHref(ID, parseTaskDetailOrigin(raw, TODAY))).toBe(
        addEventReturnHref(ID, { from: "calendar", view }),
      );
    }
  });

  it("[FAM-UI-03][AC-10] any origin but the Calendar returns to Home, as in AC-09", () => {
    expect(addEventReturnHref(ID, { from: "home" })).toBe("/family/client-margaret/home");
    expect(addEventReturnHref(ID, { from: "tasks", view: { q: "physio" } })).toBe(
      "/family/client-margaret/home",
    );
    expect(
      addEventReturnHref(ID, parseTaskDetailOrigin({ from: "https://evil.example" }, TODAY)),
    ).toBe("/family/client-margaret/home");
  });

  it("[FAM-UI-03][AC-10] hostile Calendar params fall back to the Calendar's defaults", () => {
    const origin = parseTaskDetailOrigin(
      { from: "calendar", view: "//evil.example", date: "../../x", month: "javascript:1" },
      TODAY,
    );
    expect(addEventReturnHref(ID, origin)).toBe(
      "/family/client-margaret/calendar?view=week&date=2026-11-30",
    );
  });
});
