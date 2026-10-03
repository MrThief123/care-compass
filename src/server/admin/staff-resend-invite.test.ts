// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * F0-24 AC-05: Resend invite. The service-role call lives only in
 * `src/server/jobs/admin-invite-staff.ts` (ADR-02); the action must prove the caller is an active
 * AAL2 admin of the carer's organisation, and that the carer is still pending, before it sends.
 */
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getAal: vi.fn(),
  profileRows: new Map<string, unknown>(),
  rpc: vi.fn(),
  resendStaffInviteEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: mocks.getUser,
      mfa: { getAuthenticatorAssuranceLevel: mocks.getAal },
    },
    from: () => ({
      select: () => ({
        eq: (_col: string, id: string) => ({
          maybeSingle: async () => ({ data: mocks.profileRows.get(id) ?? null, error: null }),
        }),
      }),
    }),
    rpc: mocks.rpc,
  }),
}));
vi.mock("@/server/jobs/admin-invite-staff", () => ({
  inviteStaffAccount: vi.fn(),
  resendStaffInviteEmail: mocks.resendStaffInviteEmail,
}));

import { resendStaffInvite } from "./staff-actions";

const CARER = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.profileRows.clear();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
  mocks.getAal.mockResolvedValue({ data: { currentLevel: "aal2" } });
  mocks.profileRows.set("admin-1", { role: "admin", is_active: true });
  mocks.profileRows.set(CARER, { role: "carer", email: "new.carer@example.test" });
  mocks.rpc.mockResolvedValue({ data: [CARER], error: null });
  mocks.resendStaffInviteEmail.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[F0-24][AC-05] resendStaffInvite", () => {
  it("[F0-24][AC-05] an active AAL2 admin resends to a pending carer of their organisation", async () => {
    const result = await resendStaffInvite(CARER);
    expect(result).toEqual({ ok: true, data: { id: CARER } });
    expect(mocks.resendStaffInviteEmail).toHaveBeenCalledTimes(1);
    expect(mocks.resendStaffInviteEmail).toHaveBeenCalledWith("new.carer@example.test");
  });

  it("[F0-24][AC-05] refuses a carer who has already signed in (not pending) and sends nothing", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    const result = await resendStaffInvite(CARER);
    expect(result).toMatchObject({ ok: false });
    expect(mocks.resendStaffInviteEmail).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-05] refuses a carer in another organisation (RLS hides the row) and sends nothing", async () => {
    mocks.profileRows.delete(CARER);
    const result = await resendStaffInvite(CARER);
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(mocks.resendStaffInviteEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["a carer", { role: "carer", is_active: true }],
    ["a family member", { role: "family", is_active: true }],
    ["a deactivated admin", { role: "admin", is_active: false }],
  ])("[F0-24][AC-05] refuses %s as the caller and sends nothing", async (_, profile) => {
    mocks.profileRows.set("admin-1", profile);
    const result = await resendStaffInvite(CARER);
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
    expect(mocks.resendStaffInviteEmail).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-05] refuses an admin who has not completed the TOTP challenge (AAL1)", async () => {
    mocks.getAal.mockResolvedValue({ data: { currentLevel: "aal1" } });
    const result = await resendStaffInvite(CARER);
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
    expect(mocks.resendStaffInviteEmail).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-05] refuses a signed-out caller", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await resendStaffInvite(CARER);
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
    expect(mocks.resendStaffInviteEmail).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-05] refuses a malformed id without any lookup", async () => {
    const result = await resendStaffInvite("not-a-uuid");
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(mocks.resendStaffInviteEmail).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-05] a send failure is an error result, not a throw", async () => {
    mocks.resendStaffInviteEmail.mockRejectedValue(new Error("smtp down"));
    const result = await resendStaffInvite(CARER);
    expect(result).toMatchObject({ ok: false, error: { code: "UNEXPECTED" } });
  });
});

describe("[F0-24][AC-05] resendStaffInvite (mock mode)", () => {
  it("[F0-24][AC-05] succeeds for a pending mock carer and refuses a carer who is not pending", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { createStaff } = await import("./staff-actions");
    const { getAdminStaff } = await import("./staff-queries");
    const created = await createStaff({
      firstName: "Rae",
      lastName: "Invited",
      phone: "0412 345 678",
      email: "rae.invited@example.test",
      jobTitle: "Support Worker",
    });
    if (!created.ok) throw new Error("expected the mock invite to succeed");
    const { staff, pendingIds = [] } = await getAdminStaff();
    const active = staff.find((person) => !pendingIds.includes(person.id));
    if (!active) throw new Error("expected a non-pending mock carer");
    expect(await resendStaffInvite(created.data.id)).toEqual({
      ok: true,
      data: { id: created.data.id },
    });
    expect(await resendStaffInvite(active.id)).toMatchObject({ ok: false });
  });
});
