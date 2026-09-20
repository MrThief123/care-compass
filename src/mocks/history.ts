/**
 * Deterministic completed-task history for the fixtures (UI-04).
 *
 * Each series is an event plus the carers who complete it in turn. The event's
 * `start` is the first occurrence; occurrences are expanded by the one
 * recurrence engine (`src/lib/recurrence`, CLAUDE.md §7) up to an exclusive
 * end, then written as Melbourne ISO strings with the right daylight-saving
 * offset. Nothing here reads the clock or a random number, so the same input
 * always gives the same rows.
 *
 * Read only by `src/mocks/**` — never imported by `src/app` or `src/features`.
 */
import { expandOccurrences } from "@/lib/recurrence";
import type { RecurrenceRule } from "@/lib/recurrence";
import { formatLocalDateTime, parseLocalDateTime } from "@/lib/recurrence/local-time";
import { localToMelbourneIso } from "@/mocks/melbourne-time";
import type { CareEvent, Occurrence } from "@/types/domain";

export interface HistorySeries {
  event: CareEvent;
  /** Full names, taking turns in the order given. */
  carers: readonly string[];
}

/** Only the frequencies the fixtures use; anything else is a mistake, not a silent skip. */
function ruleFor(event: CareEvent): RecurrenceRule {
  // `start` is written in Melbourne time, so its first 19 characters are the local wall clock.
  const anchor = event.start.slice(0, 19);
  switch (event.recurrenceFrequency) {
    case "daily":
      return { frequency: "daily", interval: 1, anchor };
    case "weekly":
      return { frequency: "weekly", interval: 1, anchor };
    case "fortnightly":
      return { frequency: "weekly", interval: 2, anchor };
    default:
      throw new Error(
        `generateCompletedHistory: unsupported recurrence frequency "${event.recurrenceFrequency}" for ${event.id}.`,
      );
  }
}

function addMinutes(local: string, minutes: number): string {
  return formatLocalDateTime(new Date(parseLocalDateTime(local).getTime() + minutes * 60_000));
}

/**
 * Every occurrence of every series from the event's `start` up to (not
 * including) `endExclusive` (a Melbourne local date-time), all Done. Carers
 * take turns; completion follows the start by 2 to 18 minutes, a fixed
 * pattern rather than a random one.
 */
export function generateCompletedHistory(
  series: readonly HistorySeries[],
  endExclusive: string,
): Occurrence[] {
  return series.flatMap(({ event, carers }, seriesIndex) => {
    if (carers.length === 0) {
      throw new Error(`generateCompletedHistory: ${event.id} has no carers.`);
    }
    const rule = ruleFor(event);

    return expandOccurrences(rule, { start: rule.anchor, end: endExclusive }).map(
      (slot, index): Occurrence => {
        const start = localToMelbourneIso(slot.start);
        const delayMinutes = 2 + ((index * 5 + seriesIndex * 3) % 17);
        const carer = carers[index % carers.length] as string;

        return {
          key: `${event.id}:${start}`,
          eventId: event.id,
          clientId: event.clientId,
          title: event.title,
          description: event.description,
          start,
          durationMinutes: event.durationMinutes,
          status: "done",
          actor: carer,
          assignee: carer,
          completedAt: localToMelbourneIso(addMinutes(slot.start, delayMinutes)),
        };
      },
    );
  });
}
