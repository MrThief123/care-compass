// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * ADM-10 organisation-settings action with the Supabase client faked, so what is sent to the
 * database can be checked exactly. The real database is covered in
 * supabase/tests/admin_settings.test.sql and tests/integration/admin-settings.test.ts.
 */
const mocks = vi.hoisted(() => {
  const single = vi.fn();
  const rpc = vi.fn(() => ({ single }));
  const from = vi.fn();
  const getUser = vi.fn();
  return { single, rpc, from, getUser };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: mocks.rpc,
    from: mocks.from,
    auth: { getUser: mocks.getUser },
  }),
}));

const VALID = {
  name: "Banksia Home Care",
  abn: "54123456789",
  phone: "03 9555 0102",
  address: "220 High St, Preston VIC 3072",
};

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "a1111111" } } });
  mocks.single.mockResolvedValue({
    data: { name: VALID.name, abn: "54 123 456 789", phone: VALID.phone, address: VALID.address },
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[ADM-10][AC-02] updateOrganisationSettings validates on the server", () => {
  it("[ADM-10][AC-02] refuses a bad ABN and blank fields, each on its own field, and calls nothing", async () => {
    const { updateOrganisationSettings } = await import("@/server/admin/settings-actions");

    const result = await updateOrganisationSettings({
      name: " ",
      abn: "123",
      phone: "",
      address: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.fieldErrors).toMatchObject({
        name: "Enter an organisation name.",
        abn: "Enter an ABN with 11 digits.",
        phone: "Enter a phone number.",
        address: "Enter an address.",
      });
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[ADM-10][AC-02] a non-object input is refused rather than thrown", async () => {
    const { updateOrganisationSettings } = await import("@/server/admin/settings-actions");
    expect((await updateOrganisationSettings(null as never)).ok).toBe(false);
  });
});

describe("[ADM-10][AC-04] updateOrganisationSettings saves through the RPC", () => {
  it("[ADM-10][AC-04] calls admin_update_organisation once with trimmed values and sends no organisation id", async () => {
    const { updateOrganisationSettings } = await import("@/server/admin/settings-actions");

    const result = await updateOrganisationSettings({
      ...VALID,
      name: "  Banksia Home Care ",
      abn: "54 123 456 789",
    });

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("admin_update_organisation", {
      p_name: "Banksia Home Care",
      p_abn: "54 123 456 789",
      p_phone: VALID.phone,
      p_address: VALID.address,
    });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      data: { name: VALID.name, abn: "54 123 456 789", phone: VALID.phone, address: VALID.address },
    });
  });

  it("[ADM-10][AC-05] an RPC error is a failure with a generic message that carries no data", async () => {
    mocks.single.mockResolvedValue({
      data: null,
      error: { message: "not permitted (Banksia)", code: "42501" },
    });
    const { updateOrganisationSettings } = await import("@/server/admin/settings-actions");

    const result = await updateOrganisationSettings(VALID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNEXPECTED");
      expect(result.error.message).not.toContain("Banksia");
    }
  });

  it("[ADM-10][AC-04] in mock mode it validates and succeeds without touching a database", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { updateOrganisationSettings } = await import("@/server/admin/settings-actions");

    const result = await updateOrganisationSettings(VALID);

    expect(result.ok).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
