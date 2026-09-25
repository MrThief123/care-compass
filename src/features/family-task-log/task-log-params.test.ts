import { describe, expect, it } from "vitest";

import {
  MAX_PAGE,
  MAX_QUERY_LENGTH,
  clampQueryLength,
  normaliseQuery,
  parseTaskLogParams,
} from "./task-log-params";

describe("parseTaskLogParams: status", () => {
  it("[FAM-UI-07][AC-06] defaults to no filter, page 1 and an empty search when nothing is given", () => {
    expect(parseTaskLogParams({})).toEqual({ q: "", status: undefined, page: 1 });
    expect(parseTaskLogParams(undefined)).toEqual({ q: "", status: undefined, page: 1 });
  });

  it.each(["planned", "done", "overdue"] as const)(
    "[FAM-UI-07][AC-07] accepts status=%s",
    (status) => {
      expect(parseTaskLogParams({ status }).status).toBe(status);
    },
  );

  it.each(["bogus", "", "DONE", "Done", "done,overdue", " done", "__proto__", "all", "0", "null"])(
    "[FAM-UI-07][AC-06] treats status=%j as all statuses",
    (status) => {
      expect(parseTaskLogParams({ status }).status).toBeUndefined();
    },
  );

  it("[FAM-UI-07][AC-06] takes the first value when a param is repeated, and ignores an empty list", () => {
    expect(parseTaskLogParams({ status: ["overdue", "done"] }).status).toBe("overdue");
    expect(parseTaskLogParams({ status: [] }).status).toBeUndefined();
    expect(parseTaskLogParams({ status: ["bogus", "done"] }).status).toBeUndefined();
  });
});

describe("parseTaskLogParams: page", () => {
  it.each([
    ["1", 1],
    ["2", 2],
    ["20", 20],
    ["99999", 99999],
    [" 3 ", 3],
    ["007", 7],
  ])("[FAM-UI-07][AC-06] reads page=%j as %i", (page, expected) => {
    expect(parseTaskLogParams({ page }).page).toBe(expected);
  });

  it.each(["0", "-3", "abc", "1.5", "1e3", "0x10", "", "  ", "+2", "２", "NaN", "Infinity", "2px"])(
    "[FAM-UI-07][AC-06] falls back to page 1 for page=%j",
    (page) => {
      expect(parseTaskLogParams({ page }).page).toBe(1);
    },
  );

  it("[FAM-UI-07][AC-06] falls back to page 1 when page is missing, repeated-empty or an empty list", () => {
    expect(parseTaskLogParams({}).page).toBe(1);
    expect(parseTaskLogParams({ page: [] }).page).toBe(1);
    expect(parseTaskLogParams({ page: ["4", "9"] }).page).toBe(4);
  });

  it("[FAM-UI-07][AC-06] clamps an absurdly large page instead of overflowing, so the contract never sees 1e24", () => {
    expect(parseTaskLogParams({ page: "9".repeat(400) }).page).toBe(MAX_PAGE);
    expect(parseTaskLogParams({ page: "9007199254740993" }).page).toBe(MAX_PAGE);
    expect(Number.isSafeInteger(MAX_PAGE)).toBe(true);
  });
});

describe("parseTaskLogParams: q", () => {
  it("[FAM-UI-07][AC-07] trims surrounding whitespace and keeps inner spacing", () => {
    expect(parseTaskLogParams({ q: "  morning  meds " }).q).toBe("morning  meds");
    expect(parseTaskLogParams({ q: "   " }).q).toBe("");
  });

  it("[FAM-UI-07][AC-06] caps a 5,000 character search at 200 characters", () => {
    const q = parseTaskLogParams({ q: "a".repeat(5000) }).q;

    expect(MAX_QUERY_LENGTH).toBe(200);
    expect(q).toHaveLength(200);
  });

  it("[FAM-UI-07][AC-06] caps by characters, never splitting an emoji into a broken half", () => {
    const q = parseTaskLogParams({ q: `${"a".repeat(199)}😀😀😀` }).q;

    expect([...q]).toHaveLength(200);
    expect(q.endsWith("😀")).toBe(true);
    expect(() => encodeURIComponent(q)).not.toThrow();
  });

  it("[FAM-UI-07][AC-06] replaces control characters (a NUL would break a database search) with spaces", () => {
    expect(parseTaskLogParams({ q: "a\u0000b\u0007c\td" }).q).toBe("a b c d");
    expect(parseTaskLogParams({ q: "\u0000\u0000" }).q).toBe("");
  });

  it("[FAM-UI-07][AC-06] leaves a lone surrogate unable to break URL building", () => {
    const q = parseTaskLogParams({ q: `abc\ud83d` }).q;

    expect(() => encodeURIComponent(q)).not.toThrow();
  });

  it("[FAM-UI-07][AC-07] normalises to NFC so 'é' typed either way finds the same tasks", () => {
    const composed = "Caf\u00e9";
    const decomposed = "Cafe\u0301";

    expect(decomposed).not.toBe(composed);
    expect(parseTaskLogParams({ q: decomposed }).q).toBe(composed);
    expect(parseTaskLogParams({ q: composed }).q).toBe(composed);
  });

  it("[FAM-UI-07][AC-06] a cap that lands on a space leaves no trailing space, so the value stays stable", () => {
    const q = parseTaskLogParams({ q: `${"a".repeat(199)} b` }).q;

    expect(q).toBe("a".repeat(199));
    expect(normaliseQuery(q)).toBe(q);
  });

  it("[FAM-UI-07][AC-06] takes the first value of a repeated q, and reads a missing one as empty", () => {
    expect(parseTaskLogParams({ q: ["physio", "walk"] }).q).toBe("physio");
    expect(parseTaskLogParams({ q: [] }).q).toBe("");
  });

  it.each([
    "<script>alert(1)</script>",
    '"><img src=x onerror=alert(1)>',
    "a&b=c#d",
    "100%",
    "'; DROP TABLE",
  ])("[FAM-UI-07][AC-06] passes %j through as plain text, unchanged", (q) => {
    expect(parseTaskLogParams({ q }).q).toBe(q);
  });
});

describe("normaliseQuery and clampQueryLength", () => {
  it("[FAM-UI-07][AC-07] normaliseQuery is idempotent, so a value read back from the URL never changes again", () => {
    for (const raw of ["  Zoe ", "a\u0000b", "Café", "x".repeat(300), "😀".repeat(250)]) {
      const once = normaliseQuery(raw);
      expect(normaliseQuery(once)).toBe(once);
    }
  });

  it("[FAM-UI-07][AC-06] clampQueryLength limits what the box can hold but does not trim what someone is typing", () => {
    expect(clampQueryLength("physio ")).toBe("physio ");
    expect(clampQueryLength("a".repeat(5000))).toHaveLength(200);
    expect([...clampQueryLength("😀".repeat(500))]).toHaveLength(200);
  });
});
