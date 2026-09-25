/**
 * History export (CHG-022, PD-060, DECISIONS.md FD-13): the History rows as a
 * CSV a spreadsheet opens. ISO dates so they sort, plain two-decimal amounts,
 * RFC 4180 quoting and CRLF line ends. Text a spreadsheet could run as a
 * formula is prefixed with an apostrophe (OWASP CSV injection). The byte-order
 * mark is added by the download, not here.
 */
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

const HEADER = ["Date", "Bucket", "Description", "Amount", "Status", "Recorded by", "Note"];

/** Names a row whose bucket is no longer in the budget. */
export const REMOVED_BUCKET = "Removed bucket";

/** Stated where an entry names no recorder, rather than left empty. */
export const NOT_RECORDED = "Not recorded";

/** RFC 4180: quote a field holding a comma, a double quote or a line break; double its quotes. */
function field(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** Trimmed text, with a leading `'` when it would start a formula. */
function textField(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return field(/^[=+\-@]/.test(trimmed) ? `'${trimmed}` : trimmed);
}

/** "Pending", "Paid on <date>" for a cost since paid, otherwise "Paid". */
export function fundStatus(entry: FundEntry, formatDate: (iso: string) => string): string {
  if (entry.pending) return "Pending";
  if (entry.paidOn) return `Paid on ${formatDate(entry.paidOn)}`;
  return "Paid";
}

/** The bucket's current name, or "Removed bucket". */
export function bucketName(entry: FundEntry, buckets: BudgetBucketSummary[]): string {
  return buckets.find((bucket) => bucket.id === entry.bucketId)?.label ?? REMOVED_BUCKET;
}

/** One line per entry, in the order given, under the header; every line ends in CRLF. */
export function budgetHistoryCsv(entries: FundEntry[], buckets: BudgetBucketSummary[]): string {
  const lines = entries.map((entry) =>
    [
      field(entry.date),
      textField(bucketName(entry, buckets)),
      textField(entry.description),
      (Math.round(entry.amount * 100) / 100).toFixed(2),
      field(fundStatus(entry, (iso) => iso)),
      textField(entry.recordedBy?.trim() || NOT_RECORDED),
      textField(entry.note),
    ].join(","),
  );
  return [HEADER.join(","), ...lines].map((line) => `${line}\r\n`).join("");
}

/** "budget-history-2026-11-30.csv": the reference day, and no client name. */
export function budgetHistoryFileName(today: string): string {
  return `budget-history-${today}.csv`;
}
