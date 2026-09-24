// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { MARGARET_CLIENT_ID, ROBERT_CLIENT_ID } from "@/mocks/fixtures";
import { melbourneDateKey } from "@/mocks/melbourne-time";
import { getOccurrence, getOccurrences, getTaskLog, getToday } from "@/server/events/queries";
import { OCCURRENCE_RANGE_MAX_DAYS } from "@/types/domain";
import type { Occurrence } from "@/types/domain";

/**
 * Contract tests for the calendar read (CHG-006): `getOccurrences` over a
 * Melbourne date range and `getToday`, called the way screens call them, with
 * DATA_SOURCE=mock. F0-11's Supabase implementation must pass the same rules.
 */

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const DESIGN_WEEK = { from: "2026-11-30", to: "2026-12-06" };

function melbourneTime(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

function summary(rows: Occurrence[]): string[] {
  return rows.map((row) => `${melbourneDateKey(row.start)} ${melbourneTime(row.start)} ${row.title}`);
}

describe("[FAM-UI-02][AC-01] getToday", () => {
  it("[FAM-UI-02][AC-01] is the reference day in mock mode, as a Melbourne calendar date", async () => {
    await expect(getToday()).resolves.toBe("2026-11-30");
  });
});

describe("[FAM-UI-02][AC-02] getOccurrences — the design week", () => {
  it("[FAM-UI-02][AC-02] returns the week 30 Nov – 6 Dec 2026 exactly as drawn, oldest first", async () => {
    const rows = await getOccurrences(MARGARET_CLIENT_ID, DESIGN_WEEK);

    expect(summary(rows)).toEqual([
      "2026-11-30 09:00 Morning medication",
      "2026-11-30 11:30 Physiotherapy",
      "2026-11-30 15:00 Afternoon check-in",
      "2026-12-01 09:00 Morning medication",
      "2026-12-02 10:00 Wound dressing check",
      "2026-12-03 09:30 Weekly weigh-in",
      "2026-12-04 11:30 Physiotherapy",
      "2026-12-05 14:00 Medication review",
    ]);
  });

  it("[FAM-UI-02][AC-02] carries status and actor through (Morning medication on Mon 30 is Done by Aisha Rahman)", async () => {
    const rows = await getOccurrences(MARGARET_CLIENT_ID, DESIGN_WEEK);
    const morning = rows[0] as Occurrence;

    expect(morning.status).toBe("done");
    expect(morning.actor).toBe("Aisha Rahman");
    expect(rows.slice(1).every((row) => row.status === "planned")).toBe(true);
  });

  it("[FAM-UI-02][AC-02] an upcoming row opens through getOccurrence, but the Task log does not list it", async () => {
    const rows = await getOccurrences(MARGARET_CLIENT_ID, DESIGN_WEEK);
    const fridayPhysio = rows.find(
      (row) => row.title === "Physiotherapy" && melbourneDateKey(row.start) === "2026-12-04",
    ) as Occurrence;

    await expect(getOccurrence(MARGARET_CLIENT_ID, fridayPhysio.key)).resolves.toEqual(
      fridayPhysio,
    );

    const log = await getTaskLog(MARGARET_CLIENT_ID, { q: "Physiotherapy" });
    expect(log.items.map((row) => row.key)).not.toContain(fridayPhysio.key);
  });
});

describe("[FAM-UI-02][AC-02] getOccurrences — range rules", () => {
  it("[FAM-UI-02][AC-02] from and to are inclusive Melbourne calendar days", async () => {
    // Mon 30 Nov 09:00 AEDT is 22:00Z on Sun 29, so a UTC-day filter would drop
    // Morning medication from Monday: this proves the boundary is Melbourne's.
    const monday = await getOccurrences(MARGARET_CLIENT_ID, {
      from: "2026-11-30",
      to: "2026-11-30",
    });
    expect(summary(monday)).toEqual([
      "2026-11-30 09:00 Morning medication",
      "2026-11-30 11:30 Physiotherapy",
      "2026-11-30 15:00 Afternoon check-in",
    ]);

    const sunday = await getOccurrences(MARGARET_CLIENT_ID, {
      from: "2026-11-29",
      to: "2026-11-29",
    });
    expect(summary(sunday)).toEqual([
      "2026-11-29 09:30 Weekly weigh-in",
      "2026-11-29 18:00 Evening medication",
    ]);
  });

  it("[FAM-UI-02][AC-02] reads past history too, not only the design week", async () => {
    const rows = await getOccurrences(MARGARET_CLIENT_ID, { from: "2026-09-07", to: "2026-09-13" });

    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      expect(melbourneDateKey(row.start) >= "2026-09-07").toBe(true);
      expect(melbourneDateKey(row.start) <= "2026-09-13").toBe(true);
    });
  });

  it("[FAM-UI-02][AC-02] orders oldest first by instant, ties by key ascending", async () => {
    const rows = await getOccurrences(MARGARET_CLIENT_ID, { from: "2026-10-01", to: "2026-11-11" });

    rows.slice(1).forEach((row, index) => {
      const previous = rows[index] as Occurrence;
      const a = Date.parse(previous.start);
      const b = Date.parse(row.start);
      expect(a).toBeLessThanOrEqual(b);
      if (a === b) expect(previous.key < row.key).toBe(true);
    });
  });

  it("[FAM-UI-02][AC-02] never returns another client's rows", async () => {
    const margaret = await getOccurrences(MARGARET_CLIENT_ID, DESIGN_WEEK);
    const robert = await getOccurrences(ROBERT_CLIENT_ID, DESIGN_WEEK);

    expect(margaret.every((row) => row.clientId === MARGARET_CLIENT_ID)).toBe(true);
    expect(robert.length).toBeGreaterThan(0);
    expect(robert.every((row) => row.clientId === ROBERT_CLIENT_ID)).toBe(true);
  });

  it("[FAM-UI-02][AC-02] an unknown client, or a prototype key from a URL, has an empty calendar", async () => {
    await expect(getOccurrences("client-nobody", DESIGN_WEEK)).resolves.toEqual([]);
    await expect(getOccurrences("__proto__", DESIGN_WEEK)).resolves.toEqual([]);
  });

  it("[FAM-UI-02][AC-02] an empty week is an empty list, not an error", async () => {
    await expect(
      getOccurrences(MARGARET_CLIENT_ID, { from: "2030-01-07", to: "2030-01-13" }),
    ).resolves.toEqual([]);
  });

  it("[FAM-UI-02][AC-02] returns copies: changing a returned row does not change the next read", async () => {
    const first = await getOccurrences(MARGARET_CLIENT_ID, DESIGN_WEEK);
    (first[0] as Occurrence).title = "Changed";

    const second = await getOccurrences(MARGARET_CLIENT_ID, DESIGN_WEEK);
    expect((second[0] as Occurrence).title).toBe("Morning medication");
  });

  it.each([
    ["not a date", { from: "30/11/2026", to: "2026-12-06" }],
    ["an impossible date", { from: "2026-02-30", to: "2026-03-01" }],
    ["to before from", { from: "2026-12-06", to: "2026-11-30" }],
    [
      `more than ${OCCURRENCE_RANGE_MAX_DAYS} days`,
      { from: "2026-11-01", to: "2026-12-31" },
    ],
  ])("[FAM-UI-02][AC-02] rejects %s with a ZodError", async (_label, range) => {
    await expect(getOccurrences(MARGARET_CLIENT_ID, range)).rejects.toBeInstanceOf(ZodError);
  });

  it(`[FAM-UI-02][AC-05] accepts exactly ${OCCURRENCE_RANGE_MAX_DAYS} days (a 6×7 month grid)`, async () => {
    // December 2026's grid: Mon 30 Nov to Sun 10 Jan.
    const rows = await getOccurrences(MARGARET_CLIENT_ID, { from: "2026-11-30", to: "2027-01-10" });
    expect(rows.length).toBe(8);
  });
});

describe("[FAM-UI-02] getOccurrences — data source", () => {
  it("[FAM-UI-02] says clearly that the Supabase implementation lands later", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    await expect(getOccurrences(MARGARET_CLIENT_ID, DESIGN_WEEK)).rejects.toThrow(
      /getOccurrences: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});
