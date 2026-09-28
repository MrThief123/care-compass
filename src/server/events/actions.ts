"use server";

/**
 * `events` domain Server Actions (UI-00 — see feature DECISIONS.md FD-02).
 * Validated with Zod at the trust boundary (ARCHITECTURE.md §12.4);
 * result shape per ARCHITECTURE.md §4 — never throw to the client for an
 * expected failure.
 */
import { z } from "zod";

import { localToMelbourneIso } from "@/lib/dates/melbourne-time";
import { getDataSourceMode } from "@/server/data-source";
import { RecurrenceFrequencySchema } from "@/types/domain";
import type { RecurrenceFrequency } from "@/types/domain";

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
 * `${eventId}:${originalStartISO}` (`home-routes.ts`): the event id is a bare hex id, which
 * never contains ':', unlike the ISO instant that follows it — so splitting on the first ':'
 * always finds the right boundary.
 */
const KEY_PATTERN = /^([0-9a-f-]{36}):(.+)$/i;

function parseOccurrenceKey(key: string): { eventId: string; originalStart: string } | undefined {
  const match = KEY_PATTERN.exec(key);
  return match ? { eventId: match[1]!, originalStart: match[2]! } : undefined;
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

const CreateEventInputSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string(),
  date: z.string().regex(LOCAL_DATE_PATTERN),
  startTime: z.string().regex(LOCAL_TIME_PATTERN),
  durationMinutes: z.number().int().nonnegative(),
  recurrence: RecurrenceFrequencySchema,
  isTask: z.boolean(),
});
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

/**
 * PD-046: the domain's full nine-option frequency set as the database's
 * `{frequency, interval}` pair (`daily`/`weekly`/`monthly`/`yearly` only —
 * `build-occurrences.ts` reads the same shape back). `null` is a one-off
 * event (no `recurrence` row).
 */
const RECURRENCE_TO_DB: Record<
  RecurrenceFrequency,
  { frequency: "daily" | "weekly" | "monthly" | "yearly"; interval: number } | null
> = {
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
export async function createEvent(
  input: CreateEventInput,
): Promise<ActionResult<CreateEventResult>> {
  const parsed = CreateEventInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Check the event's fields and try again." },
    };
  }
  const { clientId, title, description, date, startTime, durationMinutes, recurrence, isTask } =
    parsed.data;
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

    return { ok: true, data: { eventId: data.id } };
  } catch (error) {
    console.error("[events] createEvent failed:", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: { code: "UNEXPECTED", message: CREATE_EVENT_FAILED_MESSAGE } };
  }
}
