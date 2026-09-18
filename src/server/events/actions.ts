"use server";

/**
 * `events` domain Server Actions (UI-00 — see feature DECISIONS.md FD-02).
 * Validated with Zod at the trust boundary (ARCHITECTURE.md §12.4);
 * result shape per ARCHITECTURE.md §4 — never throw to the client for an
 * expected failure.
 */
import { z } from "zod";

import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { Occurrence } from "@/types/domain";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: "VALIDATION" | "NOT_FOUND" | "UNEXPECTED"; message: string } };

const SetOccurrenceDoneInputSchema = z.object({ key: z.string().min(1) });

/**
 * PD-044 (Manual completion mode): marks an occurrence Done, recording
 * who did it (REQ-19). Phase 1 delegates to the in-memory mock mutation;
 * F0-11 replaces this with the `set_occurrence_done` RPC (ARCHITECTURE.md
 * §4) for `DATA_SOURCE=supabase`.
 */
export async function setOccurrenceDone(key: string): Promise<ActionResult<Occurrence>> {
  const parsed = SetOccurrenceDoneInputSchema.safeParse({ key });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "A valid occurrence key is required." },
    };
  }

  const mode = getDataSourceMode();
  if (mode !== "mock") {
    notImplementedForSupabase("events", "setOccurrenceDone");
  }

  try {
    const { getCurrentUser } = await import("@/mocks/current-user");
    const mockEvents = await import("@/mocks/queries/events");
    const currentUser = await getCurrentUser();
    const actorName = `${currentUser.firstName} ${currentUser.lastName}`;
    const result = await mockEvents.setOccurrenceDone(parsed.data.key, actorName);
    return { ok: true, data: result.occurrence };
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
