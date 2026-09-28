import type { RecurrenceFrequency } from "@/types/domain";

export type DbRecurrence = {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
};

/**
 * PD-046: the domain's full nine-option frequency set as the database's
 * `{frequency, interval}` pair (`daily`/`weekly`/`monthly`/`yearly` only —
 * `build-occurrences.ts` reads the same shape back). `null` is a one-off
 * event (no `recurrence` row). Shared by `actions.ts` (write) and
 * `queries.ts` (read, via `DB_TO_RECURRENCE`) — kept out of `actions.ts`
 * because a `"use server"` file may only export async functions.
 */
export const RECURRENCE_TO_DB: Record<RecurrenceFrequency, DbRecurrence | null> = {
  none: null,
  daily: { frequency: "daily", interval: 1 },
  weekly: { frequency: "weekly", interval: 1 },
  fortnightly: { frequency: "weekly", interval: 2 },
  monthly: { frequency: "monthly", interval: 1 },
  every2months: { frequency: "monthly", interval: 2 },
  quarterly: { frequency: "monthly", interval: 3 },
  every6months: { frequency: "monthly", interval: 6 },
  yearly: { frequency: "yearly", interval: 1 },
};

/** The inverse of `RECURRENCE_TO_DB`, keyed the same way `expand.ts` reads it. */
const DB_TO_RECURRENCE_MAP = new Map<string, RecurrenceFrequency>(
  Object.entries(RECURRENCE_TO_DB)
    .filter((entry): entry is [RecurrenceFrequency, DbRecurrence] => entry[1] !== null)
    .map(([domain, db]) => [`${db.frequency}:${db.interval}`, domain]),
);

/** `getEvent`'s reverse of `RECURRENCE_TO_DB`: `null` is `"none"`, an unrecognised pair is `"none"`. */
export function dbToRecurrence(db: DbRecurrence | null): RecurrenceFrequency {
  if (!db) return "none";
  return DB_TO_RECURRENCE_MAP.get(`${db.frequency}:${db.interval}`) ?? "none";
}
