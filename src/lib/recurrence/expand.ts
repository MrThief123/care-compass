import {
  daysInMonth,
  formatLocalDateTime,
  isAfterLocalDate,
  parseLocalDate,
  parseLocalDateTime,
  type LocalMoment,
} from "@/lib/recurrence/local-time";
import {
  dateRangeSchema,
  recurrenceOverrideSchema,
  recurrenceRuleSchema,
} from "@/lib/recurrence/schema";
import type {
  DateRange,
  Occurrence,
  RecurrenceOverride,
  RecurrenceRule,
} from "@/lib/recurrence/types";

/** Hard cap on generated candidates per rule, guarding against runaway loops. */
const MAX_OCCURRENCES_PER_RULE = 100_000;

/**
 * Computes the n-th candidate occurrence, always relative to the rule's
 * anchor (`anchor + n * interval` units) rather than cumulatively from the
 * previous occurrence, so month/year-end clamping (e.g. 31 Jan -> 28 Feb)
 * never drifts the series onto a different day of the month in later
 * occurrences (e.g. Feb 28 -> Mar 28 instead of Mar 31).
 */
function stepDate(
  anchor: LocalMoment,
  frequency: RecurrenceRule["frequency"],
  interval: number,
  n: number,
): LocalMoment {
  const amount = n * interval;
  const year = anchor.getUTCFullYear();
  const monthIndex = anchor.getUTCMonth();
  const day = anchor.getUTCDate();
  const hour = anchor.getUTCHours();
  const minute = anchor.getUTCMinutes();
  const second = anchor.getUTCSeconds();

  switch (frequency) {
    case "daily":
      return new Date(Date.UTC(year, monthIndex, day + amount, hour, minute, second));
    case "weekly":
      return new Date(Date.UTC(year, monthIndex, day + amount * 7, hour, minute, second));
    case "monthly": {
      const targetMonthIndex = monthIndex + amount;
      const normalized = new Date(Date.UTC(year, targetMonthIndex, 1));
      const targetYear = normalized.getUTCFullYear();
      const normalizedMonthIndex = normalized.getUTCMonth();
      const clampedDay = Math.min(day, daysInMonth(targetYear, normalizedMonthIndex));
      return new Date(Date.UTC(targetYear, normalizedMonthIndex, clampedDay, hour, minute, second));
    }
    case "yearly": {
      const targetYear = year + amount;
      const clampedDay = Math.min(day, daysInMonth(targetYear, monthIndex));
      return new Date(Date.UTC(targetYear, monthIndex, clampedDay, hour, minute, second));
    }
    case "none":
      return anchor;
  }
}

/** Count and seek unmodified candidates without materialising a series' history.
 * Uses the same anchor arithmetic, inclusive until and safety cap as expansion.
 * Indices are relative to the requested half-open wall-clock range.
 */
export function recurrenceWindow(rule: RecurrenceRule, range: DateRange) {
  const parsed = recurrenceRuleSchema.parse(rule);
  const bounds = dateRangeSchema.parse(range);
  const anchor = parseLocalDateTime(parsed.anchor);
  const start = parseLocalDateTime(bounds.start).getTime();
  const end = parseLocalDateTime(bounds.end).getTime();
  const until = parsed.until ? parseLocalDate(parsed.until) : undefined;
  const cap = parsed.frequency === "none" ? 1 : MAX_OCCURRENCES_PER_RULE;
  const candidate = (index: number) => stepDate(anchor, parsed.frequency, parsed.interval, index);
  const lowerBound = (predicate: (date: LocalMoment) => boolean) => {
    let low = 0;
    let high = cap;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const date = candidate(middle);
      // A valid but huge interval can step beyond JavaScript's Date range.
      // Such candidates follow every valid date; retain the finite prefix.
      if (Number.isNaN(date.getTime()) || predicate(date)) high = middle;
      else low = middle + 1;
    }
    return low;
  };
  const first = lowerBound((date) => date.getTime() >= start);
  const last = lowerBound(
    (date) =>
      date.getTime() >= end ||
      (parsed.frequency !== "none" && !!until && isAfterLocalDate(date, until)),
  );
  const count = end > start ? Math.max(0, last - first) : 0;
  return {
    count,
    at(index: number): string {
      if (!Number.isInteger(index) || index < 0 || index >= count)
        throw new RangeError("Recurrence index outside window");
      return formatLocalDateTime(candidate(first + index));
    },
    indexOf(local: string): number {
      const target = parseLocalDateTime(local).getTime();
      const index = lowerBound((date) => date.getTime() >= target) - first;
      return index >= 0 && index < count && candidate(first + index).getTime() === target
        ? index
        : -1;
    },
  };
}

/**
 * Expands a recurrence rule into concrete occurrences within
 * `[range.start, range.end)`, applying any per-occurrence overrides.
 *
 * Dates are handled as Australia/Melbourne wall-clock time throughout
 * (OQ-32 proposed default): the engine never converts to a real UTC
 * instant, so a rule anchored at 09:00 stays at 09:00 local time across
 * daylight-saving transitions by construction. Converting these local
 * values to actual `timestamptz` instants is the caller's responsibility
 * (out of scope here — see F0-11).
 */
export function expandOccurrences(
  rule: RecurrenceRule,
  range: DateRange,
  overrides: RecurrenceOverride[] = [],
): Occurrence[] {
  const parsedRule = recurrenceRuleSchema.parse(rule);
  const parsedRange = dateRangeSchema.parse(range);
  const parsedOverrides = overrides.map((override) => recurrenceOverrideSchema.parse(override));

  const rangeStart = parseLocalDateTime(parsedRange.start);
  const rangeEnd = parseLocalDateTime(parsedRange.end);
  if (rangeEnd.getTime() <= rangeStart.getTime()) {
    return [];
  }

  // Canonicalize each override's originalStart to second precision before using it as a
  // map key: localDateTimeSchema (and therefore RecurrenceRule.anchor / override.originalStart)
  // accepts both "YYYY-MM-DDTHH:mm" and "YYYY-MM-DDTHH:mm:ss", but formatLocalDateTime(candidate)
  // — the key every candidate is looked up under — always emits seconds. Without this, a
  // minute-precision originalStart silently never matches and the override is dropped.
  const overridesByOriginalStart = new Map<string, RecurrenceOverride>(
    parsedOverrides.map((override) => [
      formatLocalDateTime(parseLocalDateTime(override.originalStart)),
      override,
    ]),
  );

  const anchor = parseLocalDateTime(parsedRule.anchor);

  const occurrences: Occurrence[] = [];

  const addCandidate = (candidate: LocalMoment) => {
    const originalStart = formatLocalDateTime(candidate);
    const override = overridesByOriginalStart.get(originalStart);
    if (override?.type === "cancelled") {
      return;
    }
    if (override?.type === "modified") {
      occurrences.push({
        originalStart,
        start: override.start,
        durationMinutes: override.durationMinutes,
      });
      return;
    }
    occurrences.push({ originalStart, start: originalStart });
  };

  if (parsedRule.frequency === "none") {
    if (anchor.getTime() >= rangeStart.getTime() && anchor.getTime() < rangeEnd.getTime()) {
      addCandidate(anchor);
    }
    return occurrences;
  }

  const window = recurrenceWindow(parsedRule, parsedRange);
  for (let n = 0; n < window.count; n++) {
    addCandidate(parseLocalDateTime(window.at(n)));
  }

  occurrences.sort((a, b) => a.start.localeCompare(b.start));
  return occurrences;
}
