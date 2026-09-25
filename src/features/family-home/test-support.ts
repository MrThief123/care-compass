/**
 * Test-only builders for the Family · Home tests. Fixture rows are a stand-in
 * for what real users build up over time, so these make the awkward shapes
 * cheap: a 500-item log, a 32-occurrence day, 40 overdue items, 120-character
 * titles, 60-character names, non-ASCII text and budgets of any size.
 *
 * Not imported by any screen code.
 */
import type { BudgetBucketState, BudgetBucketSummary, Occurrence } from "@/types/domain";

export const CLIENT_ID = "client-margaret";

/** ISO instant for a Melbourne wall-clock time (AEDT, +11:00), Mon 30 Nov 2026 unless a date is given. */
export function melbourne(time: string, date = "2026-11-30"): string {
  return `${date}T${time}:00+11:00`;
}

export function occurrence(
  fields: Pick<Occurrence, "title" | "start" | "status"> & Partial<Occurrence>,
): Occurrence {
  const eventId = `event-${fields.title.toLowerCase().replace(/\W+/g, "-")}`;
  return {
    key: `${eventId}:${fields.start}`,
    eventId,
    clientId: CLIENT_ID,
    description: "",
    durationMinutes: 60,
    ...fields,
  };
}

/** `text` repeated and cut to exactly `length` characters, never ending on a space. */
function exactly(length: number, text: string): string {
  const cut = text.repeat(Math.ceil(length / text.length)).slice(0, length);
  return cut.endsWith(" ") ? `${cut.slice(0, -1)}.` : cut;
}

/** 120 characters: the longest title the app promises to cope with. */
export const LONG_TITLE = exactly(
  120,
  "Administer the full evening medication round, record every dose taken and check for side effects before leaving. ",
);
/** 60 characters: the longest person name the app promises to cope with. */
export const LONG_NAME = exactly(60, "Aisha Rahman-Featherstonehaugh de la Fontaine-Montgomery ");
/** A 60-character bucket name with spaces, and one without any. */
export const LONG_LABEL = exactly(
  60,
  "Home modifications and assistive technology capital supports ",
);
export const UNBROKEN_LABEL = "Z".repeat(60);
export const NON_ASCII_TITLE = "朝の薬 — Médication du matin 💊";
export const NON_ASCII_NAME = "Zoë Ñúñez-O’Brien";

/** `count` completed occurrences, newest first, one hour apart, the newest at Mon 30 Nov 2026 09:00. */
export function doneNewestFirst(count: number): Occurrence[] {
  const newest = Date.parse(melbourne("09:00"));
  return Array.from({ length: count }, (_, index) =>
    occurrence({
      title: `Completed care ${index + 1}`,
      start: new Date(newest - index * 3_600_000).toISOString(),
      status: "done",
      actor: "Aisha Rahman",
    }),
  );
}

/** `count` overdue occurrences, newest first, one day apart, the newest on Sun 29 Nov 2026. */
export function overdueNewestFirst(count: number): Occurrence[] {
  const newest = Date.parse(melbourne("10:00", "2026-11-29"));
  return Array.from({ length: count }, (_, index) =>
    occurrence({
      title: `Overdue task ${index + 1}`,
      start: new Date(newest - index * 86_400_000).toISOString(),
      status: "overdue",
    }),
  );
}

/**
 * A busy day of `count` occurrences between 06:00 and about 21:30, with
 * overlaps (every fifth one starts with the one before it, and durations run
 * from 20 to 90 minutes), a mix of statuses, and every sixth one unassigned.
 */
export function denseDay(count: number): Occurrence[] {
  const durations = [20, 45, 60, 90, 30];
  return Array.from({ length: count }, (_, index) => {
    const slot = index % 5 === 4 ? index - 1 : index;
    const minutes = 6 * 60 + Math.floor((slot * 15.5 * 60) / count);
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const status = index % 3 === 0 ? "done" : index % 7 === 0 ? "overdue" : "planned";
    return occurrence({
      title: `Care event ${index + 1}`,
      start: melbourne(time),
      durationMinutes: durations[index % durations.length]!,
      status,
      ...(status === "done" ? { actor: "Aisha Rahman" } : {}),
      ...(index % 6 === 5 ? {} : { assignee: index % 2 === 0 ? "Aisha Rahman" : "Sarah Nguyen" }),
    });
  });
}

/** A bucket whose remaining, percent and state follow from its total and used (PD-032 thresholds). */
let bucketSeq = 0;

/** A bucket with its own `id` each time (CHG-021), unless the overrides give one. */
export function bucket(
  label: string,
  total: number,
  used: number,
  overrides: Partial<BudgetBucketSummary> = {},
): BudgetBucketSummary {
  const percentUsed = total === 0 ? 0 : Math.round((used / total) * 100);
  const state: BudgetBucketState =
    percentUsed >= 100
      ? "exhausted"
      : percentUsed >= 85
        ? "alert"
        : percentUsed >= 75
          ? "warning"
          : "ok";
  return {
    id: `bucket-${++bucketSeq}`,
    kind: "ndis",
    label,
    total,
    used,
    remaining: total - used,
    percentUsed,
    state,
    ...overrides,
  };
}
