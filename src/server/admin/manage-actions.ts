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
import { instantToMelbourneLocal, localToMelbourneIso } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { ADMIN_MANAGE } from "@/mocks/admin-manage";
import { getDataSourceMode } from "@/server/data-source";

import { assignShiftSchema, type AssignShiftValues } from "./assign-shift-schema";
import { cancelShiftSchema, updateShiftSchema, type UpdateShiftValues } from "./edit-shift-schema";
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
      logFailure("assignShift", pending.error.code);
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
      logFailure("assignShift", error?.code);
      return { ok: false, error: { code: "UNEXPECTED", message: ASSIGN_FAILED } };
    }
    return { ok: true, data: toManageShift(data) };
  } catch (error) {
    logFailure("assignShift", error instanceof Error ? error.name : undefined);
    return { ok: false, error: { code: "UNEXPECTED", message: ASSIGN_FAILED } };
  }
}

/** A feature tag and an error code only: the message may carry client data (ARCHITECTURE.md §12.5). */

export type UpdateShiftInput = UpdateShiftValues;

type ShiftFailure = {
  ok: false;
  error: {
    code: "VALIDATION" | "UNAUTHORISED" | "NOT_FOUND" | "UNEXPECTED";
    message: string;
    fieldErrors?: Record<string, string>;
  };
};
export type UpdateShiftResult = { ok: true; data: ManageShift } | ShiftFailure;
export type CancelShiftResult = { ok: true; data: { id: string } } | ShiftFailure;

const UPDATE_FAILED = "Couldn't update the shift. Try again.";
const CANCEL_FAILED = "Couldn't cancel the shift. Try again.";
const CANT_CHANGE = "That shift can't be changed.";
const ENDS_IN_PAST = "A shift can't end in the past. Cancel it instead.";
const notFound = (): ShiftFailure => ({
  ok: false,
  error: { code: "NOT_FOUND", message: CANT_CHANGE },
});

/**
 * Change a shift's carer, start and/or end (ADM-09; extending a shift is editing its end, PD-053).
 * The date is the stored shift's own, read under the admin's session, never taken from the client.
 * A shift that has ended, is cancelled, or isn't visible to this admin is NOT_FOUND. Authorisation
 * is the database's: `shifts_update_admin` (live shifts of the admin's own organisation, ending in
 * the future) and the update triggers (no deactivated or other-organisation carer, no new client).
 * Overlaps are never blocked (D30).
 */
export async function updateShift(input: UpdateShiftInput): Promise<UpdateShiftResult> {
  const parsed = fieldErrors(updateShiftSchema, input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Check the shift time.", fieldErrors: parsed.errors },
    };
  }
  const { shiftId, carerId, start, end } = parsed.data;

  if (getDataSourceMode() === "mock") {
    // Fixture screens keep edits in the page only (ADM-07 FD-08): validate, persist nothing.
    const shift = ADMIN_MANAGE.shifts.find((row) => row.id === shiftId);
    if (!shift) return notFound();
    return { ok: true, data: { ...shift, staffId: carerId, start, end } };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: { code: "UNAUTHORISED", message: CANT_CHANGE } };

    // Live shifts only: an ended or cancelled one is NOT_FOUND whatever else is wrong with the input.
    const stored = await supabase
      .from("shifts")
      .select("starts_at")
      .eq("id", shiftId)
      .is("cancelled_at", null)
      .gt("ends_at", new Date().toISOString())
      .maybeSingle();
    if (stored.error) {
      logFailure("updateShift", stored.error.code);
      return { ok: false, error: { code: "UNEXPECTED", message: UPDATE_FAILED } };
    }
    if (!stored.data) return notFound();

    const date = instantToMelbourneLocal(stored.data.starts_at).slice(0, 10);
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
    if (new Date(endsAt).getTime() <= Date.now()) {
      return {
        ok: false,
        error: { code: "VALIDATION", message: ENDS_IN_PAST, fieldErrors: { end: ENDS_IN_PAST } },
      };
    }

    // Carers invited but not signed up yet aren't rostered (ADM-08 FD-08). Fails closed.
    const pending = await supabase.rpc("admin_pending_staff_ids");
    if (pending.error) {
      logFailure("updateShift", pending.error.code);
      return { ok: false, error: { code: "UNEXPECTED", message: UPDATE_FAILED } };
    }
    if ((pending.data ?? []).includes(carerId)) {
      return { ok: false, error: { code: "UNAUTHORISED", message: NOT_SIGNED_UP } };
    }

    const { data, error } = await supabase
      .from("shifts")
      .update({ carer_id: carerId, starts_at: startsAt, ends_at: endsAt })
      .eq("id", shiftId)
      .select(
        "id, carer_id, client_id, starts_at, ends_at, carer:profiles!shifts_carer_id_fkey(first_name, last_name), client:clients(first_name, last_name)",
      )
      .maybeSingle();
    if (error) {
      if (REFUSAL_CODES.has(error.code)) {
        return { ok: false, error: { code: "UNAUTHORISED", message: NOT_ALLOWED } };
      }
      logFailure("updateShift", error.code);
      return { ok: false, error: { code: "UNEXPECTED", message: UPDATE_FAILED } };
    }
    // RLS filters silently: zero rows means it ended or was cancelled meanwhile.
    if (!data) return notFound();
    const { carer, client, ...row } = data;
    return { ok: true, data: toManageShift(row, { carer, client }) };
  } catch (error) {
    logFailure("updateShift", error instanceof Error ? error.name : undefined);
    return { ok: false, error: { code: "UNEXPECTED", message: UPDATE_FAILED } };
  }
}

/** Cancel a live shift: sets `cancelled_at`, keeps the row (PD-053). Ended shifts are NOT_FOUND. */
export async function cancelShift(shiftId: string): Promise<CancelShiftResult> {
  const parsed = cancelShiftSchema.safeParse(shiftId);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Choose a shift.";
    return { ok: false, error: { code: "VALIDATION", message, fieldErrors: { shiftId: message } } };
  }
  const id = parsed.data;

  if (getDataSourceMode() === "mock") {
    return ADMIN_MANAGE.shifts.some((row) => row.id === id)
      ? { ok: true, data: { id } }
      : notFound();
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: { code: "UNAUTHORISED", message: CANT_CHANGE } };

    // The policy only lets a live shift be updated, so zero rows is "ended, cancelled or not yours".
    const { data, error } = await supabase
      .from("shifts")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) {
      if (REFUSAL_CODES.has(error.code)) {
        return { ok: false, error: { code: "UNAUTHORISED", message: CANT_CHANGE } };
      }
      logFailure("cancelShift", error.code);
      return { ok: false, error: { code: "UNEXPECTED", message: CANCEL_FAILED } };
    }
    if (!data) return notFound();
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    logFailure("cancelShift", error instanceof Error ? error.name : undefined);
    return { ok: false, error: { code: "UNEXPECTED", message: CANCEL_FAILED } };
  }
}

/** A feature tag and an error code only: the message may carry client data (ARCHITECTURE.md §12.5). */
function logFailure(action: string, code: string | undefined) {
  console.error(`[admin-manage] ${action} failed:`, code ?? "unknown");
}
