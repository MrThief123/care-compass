/**
 * Mock-mode staff store for ADM-02 (`getAdminStaff`/`createStaff`/`updateStaff`). A module-scoped
 * mutable copy of the shared `STAFF_MEMBERS` fixture (`src/mocks/fixtures.ts`, Lane S — read-only
 * import, never mutated directly: that array is shared by other fixtures, e.g. `CARER_PROFILES`).
 * Kept in `src/server/admin/` (Lane A's own domain folder, not `src/mocks/**`) so create/edit have
 * somewhere real to write in mock mode without touching Lane S. Resets when the server process
 * restarts, same lifetime as every other mock-mode "mutation" in this app's dev/e2e runs.
 */
import { ORGANISATION, STAFF_MEMBERS } from "@/mocks/fixtures";
import type { StaffMember } from "@/types/domain";

/** PD-038: seeded defaults; the per-organisation editable list itself is not built (see ADM-02
 * DECISIONS.md FD-01 — out of this feature's scope, likely ADM-10 Admin Settings territory). */
export const STAFF_JOB_TITLES = ["Registered Nurse", "Enrolled Nurse", "Support Worker"];

let staff: StaffMember[] = STAFF_MEMBERS.map((member) => ({ ...member }));

export function listMockStaff(): StaffMember[] {
  return staff.map((member) => ({ ...member }));
}

export function addMockStaff(
  input: Omit<StaffMember, "id" | "organisationId" | "isActive">,
): StaffMember {
  const created: StaffMember = {
    id: `staff-${crypto.randomUUID()}`,
    organisationId: ORGANISATION.id,
    isActive: true,
    ...input,
  };
  staff = [...staff, created];
  return { ...created };
}

export function updateMockStaff(
  id: string,
  input: Omit<StaffMember, "id" | "organisationId" | "isActive">,
): StaffMember | undefined {
  const index = staff.findIndex((member) => member.id === id);
  if (index === -1) return undefined;
  const updated: StaffMember = { ...staff[index]!, ...input };
  staff = [...staff.slice(0, index), updated, ...staff.slice(index + 1)];
  return { ...updated };
}
