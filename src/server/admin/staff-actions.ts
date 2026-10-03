"use server";

/**
 * `admin` staff Server Actions (ADM-02). Validated with Zod at the trust boundary
 * (ARCHITECTURE.md §12.4); result shape per ARCHITECTURE.md §4 — never throw to the client for an
 * expected failure.
 */
import { z } from "zod";

import { requiredPhoneError } from "@/lib/phone/au-phone";
import {
  addMockStaff,
  deactivateMockStaff,
  updateMockStaff,
} from "@/server/admin/staff-mock-store";
import { getDataSourceMode } from "@/server/data-source";
import type { StaffMember } from "@/types/domain";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: "VALIDATION" | "NOT_FOUND" | "NOT_ALLOWED" | "UNEXPECTED"; message: string };
    };

const StaffFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.string().trim().min(1, "Enter a last name."),
  phone: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = requiredPhoneError(value);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
  email: z.string().trim().email("Enter a valid email address."),
  jobTitle: z.string().trim().min(1, "Choose a role."),
});
export type StaffFieldsInput = z.infer<typeof StaffFieldsSchema>;

const SAVE_FAILED_MESSAGE = "Couldn't save. Please try again.";

function toFields(input: StaffFieldsInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    email: input.email,
    jobTitle: input.jobTitle,
  };
}

/**
 * Invites a new carer (PD-040, PD-057): the account is created by the isolated service-role module
 * (`src/server/jobs/admin-invite-staff.ts`, ADR-02 — out-of-lane note in feature DECISIONS.md FD-01),
 * then the profile is inserted through `admin_create_staff_profile` (RLS-backed, the caller's own
 * session). If the profile insert fails after the invite succeeded, `admin_discard_staff_invite`
 * removes the half-made account so the same email can be tried again.
 */
export async function createStaff(input: StaffFieldsInput): Promise<ActionResult<StaffMember>> {
  const parsed = StaffFieldsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? SAVE_FAILED_MESSAGE,
      },
    };
  }
  const fields = toFields(parsed.data);

  const mode = getDataSourceMode();
  if (mode === "mock") {
    return { ok: true, data: addMockStaff(fields) };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: caller } = await supabase.auth.getUser();
  if (!caller.user) {
    return { ok: false, error: { code: "NOT_ALLOWED", message: "You must be signed in." } };
  }

  // F0-21: the invite below runs with the service role, which no RLS policy can stop, so the
  // caller must be proved an active admin with a completed TOTP challenge (AAL2) first — the same
  // rule `admin_create_staff_profile` applies a step later. A Server Action is a public endpoint:
  // without this, any signed-in family member or carer could send invites to any email address.
  // `getUser()` above verified this session's access token, and the AAL is read from that token.
  const [{ data: callerProfile }, { data: aal }] = await Promise.all([
    supabase.from("profiles").select("role, is_active").eq("id", caller.user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (callerProfile?.role !== "admin" || !callerProfile.is_active || aal?.currentLevel !== "aal2") {
    return { ok: false, error: { code: "NOT_ALLOWED", message: SAVE_FAILED_MESSAGE } };
  }

  const { inviteStaffAccount } = await import("@/server/jobs/admin-invite-staff");
  let userId: string;
  try {
    ({ userId } = await inviteStaffAccount(fields.email));
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UNEXPECTED",
        message: error instanceof Error ? error.message : SAVE_FAILED_MESSAGE,
      },
    };
  }

  const { data, error } = await supabase.rpc("admin_create_staff_profile", {
    p_user_id: userId,
    p_first_name: fields.firstName,
    p_last_name: fields.lastName,
    p_phone: fields.phone,
    p_email: fields.email,
    p_job_title: fields.jobTitle,
  });
  if (error || !data) {
    await supabase.rpc("admin_discard_staff_invite", { p_user_id: userId });
    return {
      ok: false,
      error: {
        code: error?.code === "42501" ? "NOT_ALLOWED" : "UNEXPECTED",
        message: SAVE_FAILED_MESSAGE,
      },
    };
  }

  return {
    ok: true,
    data: {
      id: data.id,
      organisationId: data.organisation_id ?? "",
      firstName: data.first_name ?? "",
      lastName: data.last_name ?? "",
      jobTitle: data.job_title ?? "",
      email: data.email ?? "",
      phone: data.phone ?? undefined,
      isActive: data.is_active,
    },
  };
}

/** Edits an existing carer's own organisation's profile fields, through `admin_update_staff`
 * (RLS-backed: rejects a profile outside the caller's organisation or that isn't a carer, AC-04). */
export async function updateStaff(
  id: string,
  input: StaffFieldsInput,
): Promise<ActionResult<StaffMember>> {
  const parsed = StaffFieldsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? SAVE_FAILED_MESSAGE,
      },
    };
  }
  const fields = toFields(parsed.data);

  const mode = getDataSourceMode();
  if (mode === "mock") {
    const updated = updateMockStaff(id, fields);
    if (!updated) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "That staff member was not found." },
      };
    }
    return { ok: true, data: updated };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_update_staff", {
    p_profile_id: id,
    p_first_name: fields.firstName,
    p_last_name: fields.lastName,
    p_phone: fields.phone,
    p_email: fields.email,
    p_job_title: fields.jobTitle,
  });
  if (error || !data) {
    return {
      ok: false,
      error: {
        code: error?.code === "42501" ? "NOT_ALLOWED" : "UNEXPECTED",
        message: SAVE_FAILED_MESSAGE,
      },
    };
  }

  return {
    ok: true,
    data: {
      id: data.id,
      organisationId: data.organisation_id ?? "",
      firstName: data.first_name ?? "",
      lastName: data.last_name ?? "",
      jobTitle: data.job_title ?? "",
      email: data.email ?? "",
      phone: data.phone ?? undefined,
      isActive: data.is_active,
    },
  };
}

const DEACTIVATE_FAILED_MESSAGE = "Couldn't deactivate. Please try again.";

/**
 * Deactivates a carer of the caller's organisation (ADM-03, FD-01): `admin_deactivate_staff` sets
 * `is_active` false and cancels their future shifts. Idempotent; the profile and every completion
 * are kept. The function refuses (42501) a caller who is not an active admin at AAL2 and a target
 * who is not a carer of that organisation.
 */
export async function deactivateStaff(id: string): Promise<ActionResult<StaffMember>> {
  if (!id.trim()) {
    return { ok: false, error: { code: "VALIDATION", message: "Choose a staff member." } };
  }

  const mode = getDataSourceMode();
  if (mode === "mock") {
    const updated = deactivateMockStaff(id);
    if (!updated) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "That staff member was not found." },
      };
    }
    return { ok: true, data: updated };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_deactivate_staff", { p_profile_id: id });
  if (error || !data) {
    return {
      ok: false,
      error: {
        code: error?.code === "42501" ? "NOT_ALLOWED" : "UNEXPECTED",
        message: DEACTIVATE_FAILED_MESSAGE,
      },
    };
  }

  return {
    ok: true,
    data: {
      id: data.id,
      organisationId: data.organisation_id ?? "",
      firstName: data.first_name ?? "",
      lastName: data.last_name ?? "",
      jobTitle: data.job_title ?? "",
      email: data.email ?? "",
      phone: data.phone ?? undefined,
      isActive: data.is_active,
    },
  };
}

const ResendInviteIdSchema = z.string().uuid();
const RESEND_FAILED_MESSAGE = "Couldn't send the invite. Please try again.";

/**
 * F0-24 AC-05 (FD-04): sends the invite email again to a carer who has not signed in yet. The
 * caller must be an active admin with a completed TOTP challenge (AAL2, F0-21), because the send
 * runs with the service role and no RLS policy can stop it. The carer is read under the caller's
 * own session, so RLS hides one from another organisation (NOT_FOUND), and only a carer still in
 * `admin_pending_staff_ids()` is sent to; someone who has already accepted is refused.
 */
export async function resendStaffInvite(id: string): Promise<ActionResult<{ id: string }>> {
  const parsedId = ResendInviteIdSchema.safeParse(id);
  const mode = getDataSourceMode();

  if (mode === "mock") {
    const { listMockPendingStaffIds } = await import("@/server/admin/staff-mock-store");
    return listMockPendingStaffIds().includes(id)
      ? { ok: true, data: { id } }
      : { ok: false, error: { code: "NOT_ALLOWED", message: RESEND_FAILED_MESSAGE } };
  }

  if (!parsedId.success) {
    return { ok: false, error: { code: "VALIDATION", message: RESEND_FAILED_MESSAGE } };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: caller } = await supabase.auth.getUser();
  if (!caller.user) {
    return { ok: false, error: { code: "NOT_ALLOWED", message: "You must be signed in." } };
  }

  const [{ data: callerProfile }, { data: aal }] = await Promise.all([
    supabase.from("profiles").select("role, is_active").eq("id", caller.user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (callerProfile?.role !== "admin" || !callerProfile.is_active || aal?.currentLevel !== "aal2") {
    return { ok: false, error: { code: "NOT_ALLOWED", message: RESEND_FAILED_MESSAGE } };
  }

  const { data: carer } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (!carer || carer.role !== "carer" || !carer.email) {
    return { ok: false, error: { code: "NOT_FOUND", message: RESEND_FAILED_MESSAGE } };
  }

  const { data: pendingIds, error: pendingError } = await supabase.rpc("admin_pending_staff_ids");
  if (pendingError || !pendingIds?.includes(parsedId.data)) {
    return { ok: false, error: { code: "NOT_ALLOWED", message: RESEND_FAILED_MESSAGE } };
  }

  const { resendStaffInviteEmail } = await import("@/server/jobs/admin-invite-staff");
  try {
    await resendStaffInviteEmail(carer.email);
  } catch {
    return { ok: false, error: { code: "UNEXPECTED", message: RESEND_FAILED_MESSAGE } };
  }
  return { ok: true, data: { id: parsedId.data } };
}
