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

  const overridesByOriginalStart = new Map<string, RecurrenceOverride>(
    parsedOverrides.map((override) => [override.originalStart, override]),
  );

  const anchor = parseLocalDateTime(parsedRule.anchor);
  const until = parsedRule.until ? parseLocalDate(parsedRule.until) : undefined;

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

  for (let n = 0; n < MAX_OCCURRENCES_PER_RULE; n++) {
    const candidate = stepDate(anchor, parsedRule.frequency, parsedRule.interval, n);
    if (candidate.getTime() >= rangeEnd.getTime()) {
      break;
    }
    if (until && isAfterLocalDate(candidate, until)) {
      break;
    }
    if (candidate.getTime() >= rangeStart.getTime()) {
      addCandidate(candidate);
    }
  }

  occurrences.sort((a, b) => a.start.localeCompare(b.start));
  return occurrences;
}
