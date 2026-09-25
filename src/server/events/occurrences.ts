/**
 * `getOccurrences` against Supabase (F0-11): fetches the rows as the signed-in user (RLS decides what
 * they may see) and hands them to `buildOccurrences`. Read only by `src/server/events/queries.ts`.
 *
 * Four reads for one client and one range: the events that begin before the range ends, their
 * overrides and their completions (both limited to occurrences whose original start is in the range,
 * which is how an occurrence is identified), and who was on shift (`client_shift_carers`). If the user
 * can read no events (another client's family, an unassigned carer), it returns [] without asking who
 * is on shift, since that lookup would refuse them.
 */
import { localToMelbourneIso } from "@/lib/dates/melbourne-time";
import { createClient } from "@/lib/supabase/server";
import type { AnyOccurrence, OccurrenceRange } from "@/types/domain";

import {
  buildOccurrences,
  type CompletionRow,
  type EventRow,
  type OverrideRow,
  type ShiftCarerRow,
} from "./build-occurrences";

/** A half-open window of instants: `from` inclusive, `to` exclusive. */
export interface InstantRange {
  from: string;
  to: string;
}

/**
 * The contract's range is Melbourne calendar dates, both inclusive (CHG-012); the database is read
 * over instants: from the start of `from` to the start of the day after `to`, in Melbourne time.
 */
export function melbourneDaysToInstants(range: OccurrenceRange): InstantRange {
  const [year, month, day] = range.to.split("-").map(Number) as [number, number, number];
  const dayAfter = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  return {
    from: localToMelbourneIso(`${range.from}T00:00:00`),
    to: localToMelbourneIso(`${dayAfter}T00:00:00`),
  };
}

// Any 8-4-4-4-12 hex id, as Postgres accepts (seed ids need not carry RFC version bits).
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FAILED = "getOccurrences: could not load occurrences.";

const EVENT_COLUMNS =
  "id, client_id, title, description, starts_at, duration_minutes, recurrence, recurrence_until, completion_mode, is_active, deactivated_at, created_at";

export async function loadOccurrences(
  clientId: string,
  range: InstantRange,
  now: Date,
): Promise<AnyOccurrence[]> {
  // An id that is not an id is an unknown client, which the contract says is an empty list.
  if (!ID_PATTERN.test(clientId)) return [];

  const supabase = await createClient();

  const { data: events, error: eventsError } = await supabase
    .from("care_events")
    .select(EVENT_COLUMNS)
    .eq("client_id", clientId)
    .lt("starts_at", range.to);
  // No message from the database in any error: it may name a client or a row (ARCHITECTURE.md §12.5).
  if (eventsError || !events) throw new Error(FAILED);
  if (events.length === 0) return [];

  const [overridesResult, completionsResult, shiftsResult] = await Promise.all([
    supabase
      .from("care_event_overrides")
      .select(
        "event_id, original_start, kind, new_starts_at, new_duration_minutes, new_completion_mode",
      )
      .eq("client_id", clientId)
      .gte("original_start", range.from)
      .lt("original_start", range.to),
    supabase
      .from("care_event_completions")
      .select("event_id, original_start, action, actor_display_name, occurred_at, seq")
      .eq("client_id", clientId)
      .gte("original_start", range.from)
      .lt("original_start", range.to)
      .order("seq", { ascending: true }),
    supabase.rpc("client_shift_carers", {
      p_client_id: clientId,
      p_from: range.from,
      p_to: range.to,
    }),
  ]);

  if (overridesResult.error || !overridesResult.data) throw new Error(FAILED);
  if (completionsResult.error || !completionsResult.data) throw new Error(FAILED);
  if (shiftsResult.error || !shiftsResult.data) throw new Error(FAILED);

  return buildOccurrences({
    events: events as EventRow[],
    overrides: overridesResult.data as OverrideRow[],
    completions: completionsResult.data as CompletionRow[],
    shifts: shiftsResult.data as ShiftCarerRow[],
    range,
    now,
  });
}
