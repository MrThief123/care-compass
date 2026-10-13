"use server";

/**
 * F0-27: deletes an event, or part of a recurring one. No row is removed, so history (ticks, the task
 * log, costs already charged) stays: one occurrence is cancelled with an override, and "all future"
 * ends the series with `recurrence_until` (or deactivates it when the viewed occurrence is its first).
 * Who may delete is who may edit, enforced by the care_events and care_event_overrides policies.
 */
import { z } from "zod";

import { instantToMelbourneLocal } from "@/lib/dates/melbourne-time";
import { getDataSourceMode } from "@/server/data-source";
import { refreshCachedPages } from "@/server/refresh-cache";

import type { ActionResult } from "./actions";

const DeleteEventInputSchema = z.object({
  clientId: z.string().min(1),
  eventId: z.string().min(1),
  /** The viewed occurrence's original start (its identity, PD-004). */
  occurrenceOriginalStart: z.string().min(1),
  /** "occurrence": only this one. "future": this one and every later one. */
  scope: z.enum(["occurrence", "future"]),
});
export type DeleteEventInput = z.infer<typeof DeleteEventInputSchema>;

const DELETE_FAILED_MESSAGE = "Couldn't delete. Please try again.";
const NOT_ALLOWED_MESSAGE = "Not permitted to delete this event.";

/** The Melbourne calendar date before the instant's, as `YYYY-MM-DD`. */
function melbourneDayBefore(iso: string): string {
  const day = instantToMelbourneLocal(iso).slice(0, 10);
  const before = new Date(`${day}T00:00:00Z`);
  before.setUTCDate(before.getUTCDate() - 1);
  return before.toISOString().slice(0, 10);
}

export async function deleteEvent(input: DeleteEventInput): Promise<ActionResult<undefined>> {
  const parsed = DeleteEventInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION", message: DELETE_FAILED_MESSAGE } };
  }
  const { clientId, eventId, occurrenceOriginalStart, scope } = parsed.data;

  if (getDataSourceMode() === "mock") {
    try {
      const mockEvents = await import("@/mocks/queries/events");
      await mockEvents.deleteEvent({ clientId, eventId, occurrenceOriginalStart, scope });
      refreshCachedPages();
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : DELETE_FAILED_MESSAGE,
        },
      };
    }
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: event, error: readError } = await supabase
      .from("care_events")
      .select("starts_at, recurrence")
      .eq("id", eventId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (readError) {
      return { ok: false, error: { code: "UNEXPECTED", message: DELETE_FAILED_MESSAGE } };
    }
    // Read access is at least as broad as edit access, so no row means not allowed (or not there).
    if (!event) {
      return { ok: false, error: { code: "NOT_ALLOWED", message: NOT_ALLOWED_MESSAGE } };
    }

    const cancelOne = scope === "occurrence" || event.recurrence === null;
    if (cancelOne) {
      const { error } = await supabase.from("care_event_overrides").upsert(
        {
          event_id: eventId,
          client_id: clientId,
          original_start: occurrenceOriginalStart,
          kind: "cancelled",
        },
        { onConflict: "event_id,original_start" },
      );
      if (error) return failure(error.code);
    } else {
      const isFirst = Date.parse(occurrenceOriginalStart) <= Date.parse(event.starts_at);
      const { data: rows, error } = await supabase
        .from("care_events")
        .update(
          isFirst
            ? { is_active: false }
            : { recurrence_until: melbourneDayBefore(occurrenceOriginalStart) },
        )
        .eq("id", eventId)
        .eq("client_id", clientId)
        .select("id");
      if (error) return failure(error.code);
      // RLS drops a row it does not allow instead of raising.
      if (!rows || rows.length === 0) return failure("42501");
    }

    refreshCachedPages();
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[events] deleteEvent failed:", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: { code: "UNEXPECTED", message: DELETE_FAILED_MESSAGE } };
  }
}

function failure(code: string | undefined): ActionResult<never> {
  return code === "42501"
    ? { ok: false, error: { code: "NOT_ALLOWED", message: NOT_ALLOWED_MESSAGE } }
    : { ok: false, error: { code: "UNEXPECTED", message: DELETE_FAILED_MESSAGE } };
}
