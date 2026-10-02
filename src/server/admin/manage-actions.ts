"use server";

/**
 * `admin` Manage Server Action (ADM-07): assign a carer to a client for one Melbourne date and time.
 * Validated with Zod at the trust boundary (ARCHITECTURE.md §12.4); result shape per ARCHITECTURE.md
 * §4, never throwing for an expected failure.
 *
 * Authorisation is the database's (CLAUDE.md §7): the insert runs under the admin's own session, so
 * F0-10's `shifts_insert_admin` RLS policy requires an admin of the client's organisation, and its
 * `shifts_before_insert` trigger requires the carer to be in that same organisation (and sets
 * `organisation_id` itself). Overlaps are never blocked (D30); the screen warns about them.
 */
import { fieldErrors } from "@/components/shared/forms/validation";
import { localToMelbourneIso } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { getDataSourceMode } from "@/server/data-source";

import { assignShiftSchema, type AssignShiftValues } from "./assign-shift-schema";
import { toManageShift, type ManageShift } from "./manage-queries";

type ShiftInsert = Database["public"]["Tables"]["shifts"]["Insert"];

export type AssignShiftInput = AssignShiftValues;

export type AssignShiftResult =
  | { ok: true; data: ManageShift }
  | {
      ok: false;
      error: {
        code: "VALIDATION" | "UNAUTHORISED" | "UNEXPECTED";
        message: string;
        /** Per-field messages, keyed by the input's field names. */
        fieldErrors?: Record<string, string>;
      };
    };

const ASSIGN_FAILED = "Couldn't assign the shift. Try again.";
const NOT_ALLOWED = "You can't assign this carer to this client.";
const NOT_SIGNED_UP = "This carer hasn't signed up yet, so they can't be given shifts.";
/** RLS refusal, and the F0-10 org trigger's `raise exception`. */
const REFUSAL_CODES = new Set(["42501", "P0001"]);

export async function assignShift(input: AssignShiftInput): Promise<AssignShiftResult> {
  const parsed = fieldErrors(assignShiftSchema, input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Check the shift time.", fieldErrors: parsed.errors },
    };
  }
  const { carerId, clientId, date, start, end } = parsed.data;

  let startsAt: string;
  let endsAt: string;
  try {
    startsAt = new Date(localToMelbourneIso(`${date}T${start}`)).toISOString();
    endsAt = new Date(localToMelbourneIso(`${date}T${end}`)).toISOString();
  } catch {
    // A time skipped when daylight saving starts.
    const message = "That time doesn't exist on this date (daylight saving).";
    return { ok: false, error: { code: "VALIDATION", message, fieldErrors: { start: message } } };
  }

  if (getDataSourceMode() === "mock") {
    // Fixture screens keep assignments in the page only (ADM-UI-02 FD-03).
    return {
      ok: true,
      data: { id: `mock-${crypto.randomUUID()}`, staffId: carerId, clientId, date, start, end },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: { code: "UNAUTHORISED", message: NOT_ALLOWED } };

    // A carer who has been invited but has not signed up yet is not rostered (ADM-08 FD-08). This
    // fails closed: if the lookup itself fails, no shift is created.
    const pending = await supabase.rpc("admin_pending_staff_ids");
    if (pending.error) {
      logFailure(pending.error.code);
      return { ok: false, error: { code: "UNEXPECTED", message: ASSIGN_FAILED } };
    }
    if ((pending.data ?? []).includes(carerId)) {
      return { ok: false, error: { code: "UNAUTHORISED", message: NOT_SIGNED_UP } };
    }

    // `organisation_id` is not sent: F0-10's `shifts_before_insert` trigger always sets it from the
    // client, so the caller can't choose it. The generated types can't know that, hence the cast.
    const row: Omit<ShiftInsert, "organisation_id"> = {
      carer_id: carerId,
      client_id: clientId,
      starts_at: startsAt,
      ends_at: endsAt,
      created_by: user.id,
    };
    const { data, error } = await supabase
      .from("shifts")
      .insert(row as ShiftInsert)
      .select("id, carer_id, client_id, starts_at, ends_at")
      .single();
    if (error || !data) {
      if (error && REFUSAL_CODES.has(error.code)) {
        return { ok: false, error: { code: "UNAUTHORISED", message: NOT_ALLOWED } };
      }
      logFailure(error?.code);
      return { ok: false, error: { code: "UNEXPECTED", message: ASSIGN_FAILED } };
    }
    return { ok: true, data: toManageShift(data) };
  } catch (error) {
    logFailure(error instanceof Error ? error.name : undefined);
    return { ok: false, error: { code: "UNEXPECTED", message: ASSIGN_FAILED } };
  }
}

/** A feature tag and an error code only: the message may carry client data (ARCHITECTURE.md §12.5). */
function logFailure(code: string | undefined) {
  console.error("[admin-manage] assignShift failed:", code ?? "unknown");
}
