/**
 * Rows in, occurrences out (F0-11). Pure: no database, no clock (`now` is passed in), so every
 * status is exact and testable. `getOccurrences` (occurrences.ts) fetches the rows and calls this.
 *
 * For each event: expand its recurrence rule (F0-09, in Melbourne wall-clock time) over the range,
 * apply its per-occurrence overrides, then attach status and actor from the latest completion
 * (`deriveStatus`) and the assignee from the shift that covers the start (OQ-29, PD-055).
 *
 * Occurrence key = `${eventId}:${originalStartISO}`, the ISO being Melbourne's, with its offset
 * (the shape the fixtures use, so screens see one form of key).
 */
import { z } from "zod";

import { instantToMelbourneLocal, localToMelbourneIso } from "@/lib/dates/melbourne-time";
import { deriveStatus, type LatestCompletion } from "@/lib/occurrences/derive-status";
import { expandOccurrences, type RecurrenceOverride, type RecurrenceRule } from "@/lib/recurrence";
import type { AnyOccurrence } from "@/types/domain";

/** The `care_events` columns this needs. Timestamps are ISO strings, as PostgREST returns them. */
export interface EventRow {
  id: string;
  client_id: string;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  recurrence: unknown;
  recurrence_until: string | null;
  completion_mode: string;
  is_active: boolean;
  deactivated_at: string | null;
  created_at: string;
}

export interface OverrideRow {
  event_id: string;
  original_start: string;
  kind: string;
  new_starts_at: string | null;
  new_duration_minutes: number | null;
  new_completion_mode: string | null;
}

export interface CompletionRow {
  event_id: string;
  original_start: string;
  action: string;
  actor_display_name: string;
  occurred_at: string;
  /** Insertion order: the latest completion is the highest `seq`. */
  seq: number;
}

/** A carer's shift overlapping the range, with the carer's full name (`client_shift_carers`). */
export interface ShiftCarerRow {
  carer_display_name: string;
  starts_at: string;
  ends_at: string;
}

export interface BuildOccurrencesInput {
  events: EventRow[];
  overrides: OverrideRow[];
  completions: CompletionRow[];
  shifts: ShiftCarerRow[];
  /** ISO instants; `from` is inclusive, `to` exclusive. */
  range: { from: string; to: string };
  now: Date;
}

const RecurrenceJsonSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().int().positive(),
});

const CompletionModeSchema = z.enum(["manual", "automatic"]);

/**
 * A Melbourne wall-clock time as an ISO instant with its offset. A time that does not exist,
 * because the clocks jump forward past it, moves forward an hour rather than failing the whole
 * query, as calendars do.
 */
function localToIso(local: string): string {
  try {
    return localToMelbourneIso(local);
  } catch {
    const [datePart, timePart] = local.split("T") as [string, string];
    const [year, month, day] = datePart.split("-").map(Number) as [number, number, number];
    const [hour, minute, second = 0] = timePart.split(":").map(Number) as [number, number, number?];
    const shifted = new Date(Date.UTC(year, month - 1, day, hour + 1, minute, second));
    return localToMelbourneIso(shifted.toISOString().slice(0, 19));
  }
}

function overrideForEngine(row: OverrideRow): RecurrenceOverride {
  const originalStart = instantToMelbourneLocal(row.original_start);
  if (row.kind === "cancelled") {
    return { type: "cancelled", originalStart };
  }
  return {
    type: "modified",
    originalStart,
    start: row.new_starts_at ? instantToMelbourneLocal(row.new_starts_at) : originalStart,
    ...(row.new_duration_minutes !== null && { durationMinutes: row.new_duration_minutes }),
  };
}

const byStartThenKey = (a: AnyOccurrence, b: AnyOccurrence) =>
  Date.parse(a.start) - Date.parse(b.start) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

export function buildOccurrences(input: BuildOccurrencesInput): AnyOccurrence[] {
  const { events, overrides, completions, shifts, range, now } = input;

  const rangeStart = instantToMelbourneLocal(range.from);
  const rangeEnd = instantToMelbourneLocal(range.to);

  // Latest completion per occurrence, by instant so how the database writes a timestamp
  // does not matter.
  const latestByOccurrence = new Map<string, CompletionRow>();
  for (const completion of completions) {
    const key = `${completion.event_id}|${Date.parse(completion.original_start)}`;
    const current = latestByOccurrence.get(key);
    if (!current || completion.seq > current.seq) latestByOccurrence.set(key, completion);
  }

  // The shift that started first wins where several cover an occurrence.
  const orderedShifts = [...shifts]
    .map((shift) => ({
      name: shift.carer_display_name,
      startsAt: Date.parse(shift.starts_at),
      endsAt: Date.parse(shift.ends_at),
    }))
    .sort((a, b) => a.startsAt - b.startsAt);

  const result: AnyOccurrence[] = [];

  for (const event of events) {
    const recurrence =
      event.recurrence === null ? undefined : RecurrenceJsonSchema.safeParse(event.recurrence);
    if (recurrence && !recurrence.success) {
      // Not the title or any id: the message may reach a log (ARCHITECTURE.md §12.5).
      throw new Error("care event has an invalid recurrence");
    }
    const eventMode = CompletionModeSchema.parse(event.completion_mode);

    const rule: RecurrenceRule = {
      frequency: recurrence?.data.frequency ?? "none",
      interval: recurrence?.data.interval ?? 1,
      anchor: instantToMelbourneLocal(event.starts_at),
      ...(event.recurrence_until && { until: event.recurrence_until }),
    };

    // A deactivated event stops generating occurrences from when it was deactivated (AC-08);
    // earlier ones stay, with their completions, for history.
    let end = rangeEnd;
    if (!event.is_active) {
      const stoppedAt = instantToMelbourneLocal(event.deactivated_at ?? event.created_at);
      if (stoppedAt < end) end = stoppedAt;
    }

    const eventOverrides = overrides.filter((row) => row.event_id === event.id);
    const overrideByOriginal = new Map(
      eventOverrides.map((row) => [Date.parse(row.original_start), row]),
    );

    for (const occurrence of expandOccurrences(
      rule,
      { start: rangeStart, end },
      eventOverrides.map(overrideForEngine),
    )) {
      const originalIso = localToIso(occurrence.originalStart);
      const startIso = localToIso(occurrence.start);
      const override = overrideByOriginal.get(Date.parse(originalIso));
      const mode = override?.new_completion_mode
        ? CompletionModeSchema.parse(override.new_completion_mode)
        : eventMode;

      const latestRow = latestByOccurrence.get(`${event.id}|${Date.parse(originalIso)}`);
      const latest: LatestCompletion | undefined = latestRow && {
        action: latestRow.action === "done" ? "done" : "undone",
        actorDisplayName: latestRow.actor_display_name,
        occurredAt: latestRow.occurred_at,
      };
      const derived = deriveStatus({ start: startIso, completionMode: mode }, latest, now);

      const startMs = Date.parse(startIso);
      const assignee = orderedShifts.find((s) => s.startsAt <= startMs && startMs < s.endsAt)?.name;

      const base = {
        key: `${event.id}:${originalIso}`,
        eventId: event.id,
        clientId: event.client_id,
        title: event.title,
        description: event.description,
        start: startIso,
        durationMinutes: occurrence.durationMinutes ?? event.duration_minutes,
        ...(assignee !== undefined && { assignee }),
      };

      if (derived.kind === "event") {
        result.push({ ...base, kind: "event" });
      } else if (derived.status === "done") {
        result.push({
          ...base,
          status: "done",
          actor: derived.actor,
          completedAt: derived.completedAt,
        });
      } else {
        result.push({ ...base, status: derived.status });
      }
    }
  }

  return result.sort(byStartThenKey);
}
