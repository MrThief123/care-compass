import { describe, expect, it } from "vitest";

import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

import { budgetHistoryCsv, budgetHistoryFileName } from "./budget-export";

/*
 * History export (CHG-022, PD-060, AC-17): one CSV line per History row, in
 * the order shown, under the header below. Dates are ISO so a spreadsheet
 * sorts them; amounts are plain numbers with two decimals; text a spreadsheet
 * could run as a formula is neutralised with a leading apostrophe; fields are
 * quoted as RFC 4180 says, and lines end in CRLF.
 */

const HEADER = "Date,Bucket,Description,Amount,Status,Recorded by,Note";

function bucket(id: string, label: string): BudgetBucketSummary {
  return { id, label, total: 0, used: 0, remaining: 0, percentUsed: 0, state: "ok" };
}

const BUCKETS = [
  bucket("bucket-ndis", "NDIS"),
  bucket("bucket-fixed", "Fixed"),
  bucket("bucket-government", "Government"),
];

function row(change: Partial<FundEntry> = {}): FundEntry {
  return {
    id: "fund-1",
    clientId: "client-margaret",
    bucketId: "bucket-ndis",
    type: "topup",
    amount: 6000,
    date: "2026-11-03",
    description: "NDIS quarterly plan top-up",
    recordedBy: "Helen Doyle",
    ...change,
  };
}

/** The file's lines, the final line break and the header left out. */
function linesOf(entries: FundEntry[], buckets = BUCKETS) {
  const csv = budgetHistoryCsv(entries, buckets);
  expect(csv.endsWith("\r\n")).toBe(true);
  const lines = csv.slice(0, -2).split("\r\n");
  expect(lines[0]).toBe(HEADER);
  return lines.slice(1);
}

/** The single data line for one entry. */
function lineOf(change: Partial<FundEntry>, buckets = BUCKETS) {
  const lines = linesOf([row(change)], buckets);
  expect(lines).toHaveLength(1);
  return lines[0];
}

describe("[FAM-UI-05][AC-17] budgetHistoryCsv (CHG-022)", () => {
  it("[FAM-UI-05][AC-17] starts with the header 'Date,Bucket,Description,Amount,Status,Recorded by,Note'", () => {
    expect(budgetHistoryCsv([row()], BUCKETS).split("\r\n")[0]).toBe(HEADER);
  });

  it("[FAM-UI-05][AC-17] writes one line per row, in the order given, with the bucket's name", () => {
    const lines = linesOf([
      row(),
      row({
        id: "fund-p",
        bucketId: "bucket-government",
        type: "expense",
        amount: -310,
        date: "2026-10-27",
        description: "Physiotherapy",
        recordedBy: "Aisha Rahman",
        pending: true,
      }),
      row({
        id: "fund-2",
        bucketId: "bucket-fixed",
        amount: 1000,
        date: "2026-10-15",
        description: "Fixed funding top-up",
      }),
    ]);

    expect(lines).toEqual([
      "2026-11-03,NDIS,NDIS quarterly plan top-up,6000.00,Paid,Helen Doyle,",
      "2026-10-27,Government,Physiotherapy,-310.00,Pending,Aisha Rahman,",
      "2026-10-15,Fixed,Fixed funding top-up,1000.00,Paid,Helen Doyle,",
    ]);
  });

  it("[FAM-UI-05][AC-17] with no rows, the file is the header alone", () => {
    expect(budgetHistoryCsv([], BUCKETS)).toBe(`${HEADER}\r\n`);
  });

  it("[FAM-UI-05][AC-17] amounts are plain numbers with two decimals: no $, no thousands commas, no floating-point residue", () => {
    expect(lineOf({ amount: -310 })).toContain(",-310.00,");
    expect(lineOf({ amount: 120.5 })).toContain(",120.50,");
    expect(lineOf({ amount: 0.1 + 0.2 })).toContain(",0.30,");
    expect(lineOf({ amount: 0 })).toContain(",0.00,");
    expect(lineOf({ amount: 9_999_999_999.99 })).toContain(",9999999999.99,");
    expect(lineOf({ amount: -9_999_999_999.99 })).toContain(",-9999999999.99,");
  });

  it("[FAM-UI-05][AC-17] the status is 'Paid', 'Pending', or 'Paid on <ISO date>' for a pending cost since paid", () => {
    expect(lineOf({})).toContain(",Paid,");
    expect(lineOf({ type: "expense", amount: -310, pending: true })).toContain(",Pending,");
    expect(lineOf({ type: "expense", amount: -310, paidOn: "2026-11-30" })).toContain(
      ",Paid on 2026-11-30,",
    );
  });

  it("[FAM-UI-05][AC-16] the recorder and the note are written; 'you' for a row saved in Phase 1", () => {
    expect(
      lineOf({
        date: "2026-11-30",
        amount: 500,
        description: "Q3 plan review",
        recordedBy: "you",
        note: "Q3 plan review",
      }),
    ).toBe("2026-11-30,NDIS,Q3 plan review,500.00,Paid,you,Q3 plan review");
  });

  it("[FAM-UI-05][AC-17] a missing or blank recorder is stated as 'Not recorded'; a missing or blank description or note is left empty", () => {
    expect(lineOf({ recordedBy: undefined, description: undefined })).toBe(
      "2026-11-03,NDIS,,6000.00,Paid,Not recorded,",
    );
    expect(lineOf({ recordedBy: "   ", description: "  ", note: " " })).toBe(
      "2026-11-03,NDIS,,6000.00,Paid,Not recorded,",
    );
  });

  it("[FAM-UI-05][AC-17] text is trimmed", () => {
    expect(lineOf({ description: "  Top-up  ", recordedBy: " Helen Doyle ", note: " x " })).toBe(
      "2026-11-03,NDIS,Top-up,6000.00,Paid,Helen Doyle,x",
    );
  });

  it("[FAM-UI-05][AC-17] a row whose bucket has since been removed names it 'Removed bucket'", () => {
    expect(lineOf({ bucketId: "bucket-gone", description: "Bucket removed" })).toBe(
      "2026-11-03,Removed bucket,Bucket removed,6000.00,Paid,Helen Doyle,",
    );
  });

  it("[FAM-UI-05][AC-17] a field with a comma, a double quote or a line break is quoted, with quotes doubled (RFC 4180)", () => {
    expect(lineOf({ description: "Smith, Jo" })).toContain(',"Smith, Jo",');
    expect(lineOf({ description: 'The "big" shop' })).toContain(',"The ""big"" shop",');
    expect(lineOf({ note: "Line one\nLine two" })).toContain(',"Line one\nLine two"');
    expect(lineOf({ note: "Line one\r\nLine two" })).toContain(',"Line one\r\nLine two"');
  });

  it.each([
    ["=", "=SUM(A1:A9)"],
    ["+", "+61 400 000 000"],
    ["-", "-2+3"],
    ["@", "@cmd"],
  ])(
    "[FAM-UI-05][AC-17] text starting with %s is prefixed with an apostrophe, so a spreadsheet does not run it",
    (_start, text) => {
      const line = lineOf({ description: text, recordedBy: text, note: text });
      const cell = /[",\r\n]/.test(`'${text}`) ? `"'${text.replaceAll('"', '""')}"` : `'${text}`;

      expect(line).toBe(`2026-11-03,NDIS,${cell},6000.00,Paid,${cell},${cell}`);
    },
  );

  it("[FAM-UI-05][AC-17] a bucket name that looks like a formula is neutralised too; amounts are never prefixed", () => {
    const buckets = [bucket("bucket-ndis", '=HYPERLINK("x")')];

    expect(lineOf({ amount: -40 }, buckets)).toBe(
      '2026-11-03,"\'=HYPERLINK(""x"")",NDIS quarterly plan top-up,-40.00,Paid,Helen Doyle,',
    );
  });

  it("[FAM-UI-05][AC-17] leading spaces, tabs and line breaks are trimmed first, so they cannot hide a formula", () => {
    expect(lineOf({ description: " \t\r\n=1+1" })).toContain(",'=1+1,");
  });

  it("[FAM-UI-05][AC-17] a neutralised field with a comma is still quoted", () => {
    expect(lineOf({ description: "=1,2" })).toContain(`,"'=1,2",`);
  });

  it("[FAM-UI-05][AC-17] keeps non-ASCII text as it is", () => {
    expect(lineOf({ recordedBy: "Zoë Ñuñez 朝子" })).toContain(",Zoë Ñuñez 朝子,");
  });

  it("[FAM-UI-05][PRD] changes nothing it was given", () => {
    const entries = [row({ description: "=x", pending: true })];
    const buckets = structuredClone(BUCKETS);
    const before = structuredClone(entries);

    budgetHistoryCsv(entries, buckets);

    expect(entries).toEqual(before);
    expect(buckets).toEqual(BUCKETS);
  });
});

describe("[FAM-UI-05][AC-17] budgetHistoryFileName (CHG-022)", () => {
  it("[FAM-UI-05][AC-17] names the file for the reference day: 'budget-history-2026-11-30.csv'", () => {
    expect(budgetHistoryFileName("2026-11-30")).toBe("budget-history-2026-11-30.csv");
  });

  it("[FAM-UI-05][PRD] names no client, so the file name carries no personal information", () => {
    expect(budgetHistoryFileName("2026-01-05")).toBe("budget-history-2026-01-05.csv");
  });
});
