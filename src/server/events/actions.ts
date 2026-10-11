"use server";

/**
 * `events` domain Server Actions (UI-00 — see feature DECISIONS.md FD-02).
 * Validated with Zod at the trust boundary (ARCHITECTURE.md §12.4);
 * result shape per ARCHITECTURE.md §4 — never throw to the client for an
 * expected failure.
 */
import { z } from "zod";

import { localToMelbourneIso, melbourneDateKey } from "@/lib/dates/melbourne-time";
import { getDataSourceMode } from "@/server/data-source";
import { parseOccurrenceKey } from "@/server/events/occurrence-key";
import { RECURRENCE_TO_DB } from "@/server/events/recurrence-mapping";
import { refreshCachedPages } from "@/server/refresh-cache";
import { RecurrenceFrequencySchema } from "@/types/domain";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: "VALIDATION" | "NOT_FOUND" | "NOT_ALLOWED" | "UNEXPECTED"; message: string };
    };

const SetOccurrenceDoneInputSchema = z.object({ key: z.string().min(1) });

/** FAM-05's copy for a failed tick or untick (PRD.md Error/Edge cases, PROPOSED). */
const TICK_FAILED_MESSAGE = "Couldn't save. Please try again.";

/**
 * A tick or untick changes the calendar, task log, home timelines and (through the charge trigger)
 * the budget, on pages the client may have cached. Revalidating the root layout drops the server
 * and client router caches, so every page reads the new state on its next visit.
 */
function refreshAfterTick(): void {
  refreshCachedPages();
}

/** What a tick-off confirms, once the server has recorded it. */
export interface TickResult {
  actor: string;
  completedAt: string;
}

/**
 * PD-044 (Manual completion mode): marks an occurrence Done, recording
 * who did it (REQ-19), through the `set_occurrence_done` RPC for
 * `DATA_SOURCE=supabase` (FAM-05); Phase 1 delegates to the in-memory mock
 * mutation.
 */
export async function setOccurrenceDone(key: string): Promise<ActionResult<TickResult>> {
  const parsed = SetOccurrenceDoneInputSchema.safeParse({ key });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "A valid occurrence key is required." },
    };
  }

  const mode = getDataSourceMode();
  if (mode === "mock") {
    try {
      const { getCurrentUser } = await import("@/mocks/current-user");
      const mockEvents = await import("@/mocks/queries/events");
      const currentUser = await getCurrentUser();
      const actorName = `${currentUser.firstName} ${currentUser.lastName}`;
      const result = await mockEvents.setOccurrenceDone(parsed.data.key, actorName);
      refreshAfterTick();
      return {
        ok: true,
        data: {
          actor: actorName,
          completedAt: result.occurrence.completedAt ?? new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : "Occurrence not found.",
        },
      };
    }
  }

  const target = parseOccurrenceKey(parsed.data.key);
  if (!target) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "A valid occurrence key is required." },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("set_occurrence_done", {
      p_event_id: target.eventId,
      p_original_start: target.originalStart,
    });

    if (error) {
      // Fixed messages by error code: the database's text may name a client or event.
      switch (error.code) {
        case "42501":
          return {
            ok: false,
            error: { code: "NOT_ALLOWED", message: "Not permitted to tick off this task." },
          };
        case "P0002":
        case "22023":
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "That task is no longer available." },
          };
        default:
          return { ok: false, error: { code: "UNEXPECTED", message: TICK_FAILED_MESSAGE } };
      }
    }

    refreshAfterTick();
    return { ok: true, data: { actor: data.actor_display_name, completedAt: data.occurred_at } };
  } catch (error) {
    // A feature tag and the error's class only: the message may carry client data (ARCHITECTURE.md §12.5).
    console.error(
      "[events] setOccurrenceDone failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: { code: "UNEXPECTED", message: TICK_FAILED_MESSAGE } };
  }
}

/**
 * OQ-10: undoes a Done occurrence via the `set_occurrence_undone` RPC for
 * `DATA_SOURCE=supabase` (FAM-05) — the client's family may undo anyone's
 * tick; a carer only their own, and only on an active shift (enforced by the
 * database, not here). Phase 1 delegates to the in-memory mock mutation.
 */
export async function setOccurrenceUndone(key: string): Promise<ActionResult<undefined>> {
  const parsed = SetOccurrenceDoneInputSchema.safeParse({ key });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "A valid occurrence key is required." },
    };
  }

  const mode = getDataSourceMode();
  if (mode === "mock") {
    try {
      const mockEvents = await import("@/mocks/queries/events");
      await mockEvents.setOccurrenceUndone(parsed.data.key);
      refreshAfterTick();
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : "Occurrence not found.",
        },
      };
    }
  }

  const target = parseOccurrenceKey(parsed.data.key);
  if (!target) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "A valid occurrence key is required." },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.rpc("set_occurrence_undone", {
      p_event_id: target.eventId,
      p_original_start: target.originalStart,
    });

    if (error) {
      switch (error.code) {
        case "42501":
          return {
            ok: false,
            error: { code: "NOT_ALLOWED", message: "Not permitted to undo this task." },
          };
        case "P0002":
        case "22023":
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "That task is not marked Done." },
          };
        default:
          return { ok: false, error: { code: "UNEXPECTED", message: TICK_FAILED_MESSAGE } };
      }
    }

    refreshAfterTick();
    return { ok: true, data: undefined };
  } catch (error) {
    console.error(
      "[events] setOccurrenceUndone failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: { code: "UNEXPECTED", message: TICK_FAILED_MESSAGE } };
  }
}

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** FAM-18: an 'Ends' date before the event's Date. The form checks it first; this is the backstop. */
const END_BEFORE_DATE_RESULT: ActionResult<never> = {
  ok: false,
  error: { code: "VALIDATION", message: "Ends must be on or after the Date." },
};

/** An event's cost and the bucket that pays it (FAM-11, FD-07). */
const EventCostSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  bucketId: z.string().min(1),
});

/**
 * Saves an event's cost and bucket through `set_event_cost`; `null` clears both. The cost applies to the
 * occurrences from now on (F0-12). Returns an error result, or undefined when saved.
 */
async function saveEventCost(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  eventId: string,
  cost: z.infer<typeof EventCostSchema> | null,
): Promise<ActionResult<never> | undefined> {
  // The generated types make both arguments required; the function takes null to clear.
  const { error } = await supabase.rpc("set_event_cost", {
    p_event_id: eventId,
    p_cost: (cost ? cost.amount : null) as number,
    p_bucket_id: (cost ? cost.bucketId : null) as string,
  });
  if (!error) return undefined;
  if (error.code === "42501") {
    return {
      ok: false,
      error: { code: "NOT_ALLOWED", message: "Not permitted to change this event's cost." },
    };
  }
  if (error.code === "22023") {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Check the cost and the bucket and try again." },
    };
  }
  return {
    ok: false,
    error: { code: "UNEXPECTED", message: "Couldn't save the cost. Please try again." },
  };
}

const CreateEventInputSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string(),
  date: z.string().regex(LOCAL_DATE_PATTERN),
  startTime: z.string().regex(LOCAL_TIME_PATTERN),
  durationMinutes: z.number().int().nonnegative(),
  recurrence: RecurrenceFrequencySchema,
  isTask: z.boolean(),
  /** Cost and bucket (FAM-11); absent for no cost. */
  cost: EventCostSchema.optional(),
  /** FAM-18: the day the series stops after, inclusive; absent repeats forever. */
  endDate: z.string().regex(LOCAL_DATE_PATTERN).optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export interface CreateEventResult {
  eventId: string;
}

const CREATE_EVENT_FAILED_MESSAGE = "Couldn't save. Please try again.";

/**
 * FAM-06: creates a one-off or recurring care event from the Add event form.
 * `date` + `startTime` (Melbourne wall-clock, OQ-32) become the event's
 * anchor `starts_at`; recurrence repeats indefinitely (no end date — not a
 * field this form has, PD-046's default). Permission is enforced by
 * `care_events_insert`'s RLS policy (family only, or a carer on an active
 * shift — ARCHITECTURE.md "authorisation lives in RLS"), not re-checked here.
 */
async function createEventImpl(input: CreateEventInput): Promise<ActionResult<CreateEventResult>> {
  const parsed = CreateEventInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Check the event's fields and try again." },
    };
  }
  const {
    clientId,
    title,
    description,
    date,
    startTime,
    durationMinutes,
    recurrence,
    isTask,
    cost,
    endDate,
  } = parsed.data;
  if (endDate && endDate < date) return END_BEFORE_DATE_RESULT;
  // A one-off has nothing to end.
  const recurrenceEnd = recurrence !== "none" ? endDate : undefined;
  const startsAt = localToMelbourneIso(`${date}T${startTime}`);
  const completionMode = isTask ? "manual" : "automatic";

  const mode = getDataSourceMode();
  if (mode === "mock") {
    const mockEvents = await import("@/mocks/queries/events");
    const eventId = await mockEvents.createEvent({
      clientId,
      title,
      description,
      startsAt,
      durationMinutes,
      recurrenceFrequency: recurrence,
      completionMode,
      ...(recurrenceEnd ? { recurrenceEndDate: recurrenceEnd } : {}),
    });
    return { ok: true, data: { eventId } };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("care_events")
      .insert({
        client_id: clientId,
        title,
        description,
        starts_at: startsAt,
        duration_minutes: durationMinutes,
        recurrence: RECURRENCE_TO_DB[recurrence],
        recurrence_until: recurrenceEnd ?? null,
        completion_mode: completionMode,
      })
      .select("id")
      .single();

    if (error) {
      switch (error.code) {
        case "42501":
          return {
            ok: false,
            error: {
              code: "NOT_ALLOWED",
              message: "Not permitted to add an event for this client.",
            },
          };
        case "23503":
          return {
            ok: false,
            error: { code: "VALIDATION", message: "That client could not be found." },
          };
        default:
          return {
            ok: false,
            error: { code: "UNEXPECTED", message: CREATE_EVENT_FAILED_MESSAGE },
          };
      }
    }

    if (cost) {
      const costFailure = await saveEventCost(supabase, data.id, cost);
      if (costFailure) {
        return {
          ok: false,
          error: {
            code: costFailure.ok ? "UNEXPECTED" : costFailure.error.code,
            message:
              "The event was saved, but its cost wasn't. Open the event and add the cost again.",
          },
        };
      }
    }

    return { ok: true, data: { eventId: data.id } };
  } catch (error) {
    console.error("[events] createEvent failed:", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: { code: "UNEXPECTED", message: CREATE_EVENT_FAILED_MESSAGE } };
  }
}

export async function createEvent(
  ...args: Parameters<typeof createEventImpl>
): ReturnType<typeof createEventImpl> {
  const result = await createEventImpl(...args);
  if ((result as { ok?: boolean }).ok !== false) refreshCachedPages();
  return result;
}

/**
 * FAM-07's scope choice (PD-045): "occurrence" writes a `care_event_overrides` row for the
 * viewed occurrence's start (PD-004) — every other field is a series-level column, so it always
 * updates the whole event either way. "series" writes the anchor `starts_at` directly, and is
 * refused (VALIDATION) for a recurring event whose date actually changed: doing that would shift
 * every occurrence's identity (`key`), orphaning history keyed to the old instants. A one-off
 * event (no recurrence) has only one occurrence, so "series" may always move its date.
 */
const UpdateEventScopeSchema = z.enum(["occurrence", "series"]);
export type UpdateEventScope = z.infer<typeof UpdateEventScopeSchema>;

const UpdateEventInputSchema = z.object({
  clientId: z.string().min(1),
  eventId: z.string().min(1),
  /** The viewed occurrence's original start (its identity, PD-004) — never the edited value. */
  occurrenceOriginalStart: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string(),
  date: z.string().regex(LOCAL_DATE_PATTERN),
  startTime: z.string().regex(LOCAL_TIME_PATTERN),
  durationMinutes: z.number().int().nonnegative(),
  recurrence: RecurrenceFrequencySchema,
  isTask: z.boolean(),
  scope: UpdateEventScopeSchema,
  /** Cost and bucket (FAM-11): a value sets them, `null` clears them, absent leaves them as they are. */
  cost: EventCostSchema.nullable().optional(),
  /** FAM-18: a date sets the series end, `null` clears it, absent leaves it as it is. */
  endDate: z.string().regex(LOCAL_DATE_PATTERN).nullable().optional(),
});
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;

export interface UpdateEventResult {
  eventId: string;
}

const UPDATE_EVENT_FAILED_MESSAGE = "Couldn't save. Please try again.";
const UPDATE_EVENT_NOT_ALLOWED = "Not permitted to edit this event.";

function mapUpdateEventError(code: string | null | undefined): ActionResult<never> {
  switch (code) {
    // RLS silently drops the row from an UPDATE rather than raising; PGRST116 is `.single()`
    // seeing 0 rows back, which means either — never which, so as not to leak the difference.
    case "42501":
    case "PGRST116":
      return { ok: false, error: { code: "NOT_ALLOWED", message: UPDATE_EVENT_NOT_ALLOWED } };
    case "23503":
    case "P0002":
      return {
        ok: false,
        error: { code: "VALIDATION", message: "That event could not be found." },
      };
    default:
      return { ok: false, error: { code: "UNEXPECTED", message: UPDATE_EVENT_FAILED_MESSAGE } };
  }
}

async function updateEventImpl(input: UpdateEventInput): Promise<ActionResult<UpdateEventResult>> {
  const parsed = UpdateEventInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Check the event's fields and try again." },
    };
  }
  const {
    clientId,
    eventId,
    occurrenceOriginalStart,
    title,
    description,
    date,
    startTime,
    durationMinutes,
    recurrence,
    isTask,
    scope,
    cost,
    endDate,
  } = parsed.data;
  if (endDate && endDate < date) return END_BEFORE_DATE_RESULT;
  // A one-off has nothing to end, so stopping a repeat clears the end date too.
  const recurrenceEnd = recurrence === "none" && endDate !== undefined ? null : endDate;
  const startsAt = localToMelbourneIso(`${date}T${startTime}`);
  const completionMode = isTask ? "manual" : "automatic";

  const mode = getDataSourceMode();
  if (mode === "mock") {
    try {
      const mockEvents = await import("@/mocks/queries/events");
      await mockEvents.updateEvent({
        clientId,
        eventId,
        occurrenceOriginalStart,
        title,
        description,
        startsAt,
        durationMinutes,
        recurrenceFrequency: recurrence,
        completionMode,
        scope,
        ...(recurrenceEnd !== undefined ? { recurrenceEndDate: recurrenceEnd } : {}),
      });
      return { ok: true, data: { eventId } };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : "Event not found.",
        },
      };
    }
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const seriesFields = {
      title,
      description,
      recurrence: RECURRENCE_TO_DB[recurrence],
      duration_minutes: durationMinutes,
      completion_mode: completionMode,
      ...(recurrenceEnd !== undefined ? { recurrence_until: recurrenceEnd } : {}),
    };

    if (scope === "occurrence") {
      const { error: seriesError } = await supabase
        .from("care_events")
        .update(seriesFields)
        .eq("id", eventId)
        .eq("client_id", clientId)
        .select("id")
        .single();
      if (seriesError) return mapUpdateEventError(seriesError.code);

      const { error: overrideError } = await supabase.from("care_event_overrides").upsert(
        {
          event_id: eventId,
          client_id: clientId,
          original_start: occurrenceOriginalStart,
          kind: "modified",
          new_starts_at: startsAt,
        },
        { onConflict: "event_id,original_start" },
      );
      if (overrideError) return mapUpdateEventError(overrideError.code);
      if (cost !== undefined) {
        const costFailure = await saveEventCost(supabase, eventId, cost);
        if (costFailure) return costFailure;
      }
      return { ok: true, data: { eventId } };
    }

    const { data: existing, error: readError } = await supabase
      .from("care_events")
      .select("starts_at, recurrence")
      .eq("id", eventId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (readError) return mapUpdateEventError(readError.code);
    // Read access is at least as broad as edit access, so a caller who cannot even read the
    // event certainly cannot edit it either — the same NOT_ALLOWED the UPDATE branch above maps
    // PGRST116 to, not NOT_FOUND, so this scope's own failure mode does not leak that distinction.
    if (!existing) return mapUpdateEventError("PGRST116");
    if (existing.recurrence !== null && Date.parse(existing.starts_at) !== Date.parse(startsAt)) {
      return {
        ok: false,
        error: {
          code: "VALIDATION",
          message: "To move a date on a recurring event, choose 'This occurrence' instead.",
        },
      };
    }

    const { error } = await supabase
      .from("care_events")
      .update({ ...seriesFields, starts_at: startsAt })
      .eq("id", eventId)
      .eq("client_id", clientId)
      .select("id")
      .single();
    if (error) return mapUpdateEventError(error.code);

    if (cost !== undefined) {
      const costFailure = await saveEventCost(supabase, eventId, cost);
      if (costFailure) return costFailure;
    }

    return { ok: true, data: { eventId } };
  } catch (error) {
    console.error("[events] updateEvent failed:", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: { code: "UNEXPECTED", message: UPDATE_EVENT_FAILED_MESSAGE } };
  }
}

export async function updateEvent(
  ...args: Parameters<typeof updateEventImpl>
): ReturnType<typeof updateEventImpl> {
  const result = await updateEventImpl(...args);
  if ((result as { ok?: boolean }).ok !== false) refreshCachedPages();
  return result;
}

const DeleteEventOccurrenceInputSchema = z.object({
  clientId: z.string().min(1),
  eventId: z.string().min(1),
  /** The deleted occurrence's original start (its identity, PD-004). */
  occurrenceOriginalStart: z.string().min(1),
  scope: z.enum(["occurrence", "future"]),
});
export type DeleteEventOccurrenceInput = z.infer<typeof DeleteEventOccurrenceInputSchema>;

const DELETE_EVENT_FAILED_MESSAGE = "Couldn't delete. Please try again.";
const DELETE_EVENT_NOT_ALLOWED = "Not permitted to delete this event.";
const DELETE_EVENT_DONE_MESSAGE = "Completed care can't be deleted.";

/** `YYYY-MM-DD` minus one day. */
function dayBefore(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! - 1)).toISOString().slice(0, 10);
}

/**
 * FAM-18: deletes one occurrence of an event, or that occurrence and every later one. Nothing is
 * physically removed (no role has DELETE, and completions are append-only): "occurrence" upserts a
 * `cancelled` override (PD-004); "future" ends the series the Melbourne day before the occurrence
 * by setting `recurrence_until`, never lengthening an earlier end. A one-off event has one
 * occurrence, so either scope cancels it. A Done occurrence is refused. Permission is RLS's
 * (`can_edit_care_events`: the client's family, or a carer on shift), not re-checked here.
 */
async function deleteEventOccurrenceImpl(
  input: DeleteEventOccurrenceInput,
): Promise<ActionResult<undefined>> {
  const parsed = DeleteEventOccurrenceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: DELETE_EVENT_FAILED_MESSAGE },
    };
  }
  const { clientId, eventId, occurrenceOriginalStart, scope } = parsed.data;
  const notAllowed: ActionResult<never> = {
    ok: false,
    error: { code: "NOT_ALLOWED", message: DELETE_EVENT_NOT_ALLOWED },
  };
  const done: ActionResult<never> = {
    ok: false,
    error: { code: "VALIDATION", message: DELETE_EVENT_DONE_MESSAGE },
  };

  if (getDataSourceMode() === "mock") {
    const mockEvents = await import("@/mocks/queries/events");
    const outcome = await mockEvents.deleteEventOccurrence({
      clientId,
      eventId,
      occurrenceOriginalStart,
      scope,
      dayBefore: dayBefore(melbourneDateKey(occurrenceOriginalStart)),
    });
    if (outcome === "done") return done;
    if (outcome === "not-found") {
      return { ok: false, error: { code: "NOT_FOUND", message: "That event could not be found." } };
    }
    return { ok: true, data: undefined };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: event, error: readError } = await supabase
      .from("care_events")
      .select("id, starts_at, recurrence, recurrence_until")
      .eq("id", eventId)
      .eq("client_id", clientId)
      .maybeSingle();
    // Read access is at least as broad as delete access, so an unreadable event is NOT_ALLOWED,
    // the same answer as a refused write: it does not say which.
    if (readError || !event) return notAllowed;

    const { data: latest, error: completionError } = await supabase
      .from("care_event_completions")
      .select("action")
      .eq("event_id", eventId)
      .eq("original_start", occurrenceOriginalStart)
      .order("seq", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (completionError) {
      return { ok: false, error: { code: "UNEXPECTED", message: DELETE_EVENT_FAILED_MESSAGE } };
    }
    if (latest?.action === "done") return done;

    if (scope === "future" && event.recurrence !== null) {
      const endsOn = dayBefore(melbourneDateKey(occurrenceOriginalStart));
      const { error } = await supabase
        .from("care_events")
        .update({
          recurrence_until:
            event.recurrence_until && event.recurrence_until < endsOn
              ? event.recurrence_until
              : endsOn,
        })
        .eq("id", eventId)
        .eq("client_id", clientId)
        .select("id")
        .single();
      if (error) return mapDeleteEventError(error.code);
      return { ok: true, data: undefined };
    }

    const { error } = await supabase.from("care_event_overrides").upsert(
      {
        event_id: eventId,
        client_id: clientId,
        original_start: occurrenceOriginalStart,
        kind: "cancelled",
        // A cancelled row carries no new values (care_event_overrides_kind_shape), so a prior
        // 'modified' override on this occurrence is overwritten cleanly.
        new_starts_at: null,
        new_duration_minutes: null,
        new_completion_mode: null,
      },
      { onConflict: "event_id,original_start" },
    );
    if (error) return mapDeleteEventError(error.code);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error(
      "[events] deleteEventOccurrence failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: { code: "UNEXPECTED", message: DELETE_EVENT_FAILED_MESSAGE } };
  }
}

function mapDeleteEventError(code: string | null | undefined): ActionResult<never> {
  // RLS silently drops an UPDATE's row rather than raising; PGRST116 is `.single()` seeing none.
  if (code === "42501" || code === "PGRST116") {
    return { ok: false, error: { code: "NOT_ALLOWED", message: DELETE_EVENT_NOT_ALLOWED } };
  }
  return { ok: false, error: { code: "UNEXPECTED", message: DELETE_EVENT_FAILED_MESSAGE } };
}

export async function deleteEventOccurrence(
  ...args: Parameters<typeof deleteEventOccurrenceImpl>
): ReturnType<typeof deleteEventOccurrenceImpl> {
  const result = await deleteEventOccurrenceImpl(...args);
  if ((result as { ok?: boolean }).ok !== false) refreshCachedPages();
  return result;
}
