import { listMockStaff, STAFF_JOB_TITLES } from "@/server/admin/staff-mock-store";
import { getDataSourceMode } from "@/server/data-source";
import type { StaffMember } from "@/types/domain";

export type { StaffMember };

export interface AdminStaffData {
  staff: StaffMember[];
  roles: string[];
}

/**
 * The signed-in admin's organisation's carers (ADM-02), full name always shown (PD-038). RLS scopes
 * a plain `select` to the caller's own organisation (`profiles_select_same_org`), same as ADM-01's
 * reads — no manual `organisation_id` filter needed. `roles` is the fixed seeded job-title list
 * (PD-038); the per-organisation editable list itself is not built (ADM-02 DECISIONS.md FD-01).
 */
export async function getAdminStaff(): Promise<AdminStaffData> {
  if (getDataSourceMode() === "mock") {
    return { staff: listMockStaff(), roles: [...STAFF_JOB_TITLES] };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, organisation_id, first_name, last_name, job_title, email, phone, is_active")
    .eq("role", "carer")
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });
  // The message names no client (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getAdminStaff: could not load the organisation's staff.");

  return {
    staff: data.map((row) => ({
      id: row.id,
      organisationId: row.organisation_id ?? "",
      firstName: row.first_name ?? "",
      lastName: row.last_name ?? "",
      jobTitle: row.job_title ?? "",
      email: row.email ?? "",
      phone: row.phone ?? undefined,
      isActive: row.is_active,
    })),
    roles: [...STAFF_JOB_TITLES],
  };
}
