// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * FAM-13 server pieces with the Supabase client faked, so the exact RPC call and
 * the way each database error is reported can be checked. The real database is
 * covered in supabase/tests/transfer_client_organisation.test.sql and
 * tests/integration/family-change-organisation.test.ts.
 */
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: mocks.rpc }),
}));

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const WATTLE_ID = "22222222-2222-2222-2222-222222222222";
const BANKSIA_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  mocks.rpc.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[FAM-13][AC-01] changeClientOrganisation", () => {
  it("[FAM-13][AC-01] calls transfer_client_organisation once with the client and the new organisation", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { changeClientOrganisation } = await import("@/server/clients/actions");

    const result = await changeClientOrganisation(CLIENT_ID, WATTLE_ID);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("transfer_client_organisation", {
      p_client_id: CLIENT_ID,
      p_new_org_id: WATTLE_ID,
    });
  });

  it.each([
    ["an empty client id", "", WATTLE_ID],
    ["a client id that is not a uuid", "client-margaret", WATTLE_ID],
    ["an empty organisation id", CLIENT_ID, ""],
    ["an organisation id that is not a uuid", CLIENT_ID, "wattle"],
  ])("[FAM-13][AC-01] refuses %s and calls nothing", async (_label, clientId, organisationId) => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { changeClientOrganisation } = await import("@/server/clients/actions");

    const result = await changeClientOrganisation(clientId, organisationId);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[FAM-13][AC-06] reports a permission error from the database as not allowed, in words that name nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: `not permitted for client ${CLIENT_ID}` },
    });
    const { changeClientOrganisation } = await import("@/server/clients/actions");

    const result = await changeClientOrganisation(CLIENT_ID, WATTLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_ALLOWED");
      expect(result.error.message).not.toContain(CLIENT_ID);
    }
  });

  it.each([
    ["P0002", "That organisation is no longer available. Choose another."],
    ["22023", "That is already the current organisation."],
  ])("[FAM-13][AC-01] reports database error %s with its own message", async (code, message) => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.rpc.mockResolvedValue({ data: null, error: { code, message: "raw text" } });
    const { changeClientOrganisation } = await import("@/server/clients/actions");

    const result = await changeClientOrganisation(CLIENT_ID, WATTLE_ID);

    expect(result).toEqual({ ok: false, error: { code: "UNEXPECTED", message } });
  });

  it("[FAM-13][AC-01] reports any other database error with a generic message that carries no data", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: `boom for ${CLIENT_ID}` },
    });
    const { changeClientOrganisation } = await import("@/server/clients/actions");

    const result = await changeClientOrganisation(CLIENT_ID, WATTLE_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNEXPECTED");
      expect(result.error.message).toBe("Couldn't change the organisation. Try again.");
    }
  });

  it("[FAM-13][AC-01] a thrown error is a failed change, not a crash", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.rpc.mockRejectedValue(new Error("network"));
    const { changeClientOrganisation } = await import("@/server/clients/actions");

    const result = await changeClientOrganisation(CLIENT_ID, WATTLE_ID);

    expect(result.ok).toBe(false);
  });

  it("[FAM-13][AC-01] with the mock data source it says the change is not available yet, and calls nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { changeClientOrganisation } = await import("@/server/clients/actions");

    const result = await changeClientOrganisation("client-margaret", "org-wattle");

    expect(result).toEqual({
      ok: false,
      error: {
        code: "NOT_AVAILABLE",
        message: "Choosing a new organisation is not available yet.",
      },
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("[FAM-13] getOrganisationChoices", () => {
  it("[FAM-13] reads list_organisations_for_transfer and returns id, name and whether it is current", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.rpc.mockResolvedValue({
      data: [
        { id: BANKSIA_ID, name: "Banksia Home Care", is_current: true },
        { id: WATTLE_ID, name: "Wattle Care", is_current: false },
      ],
      error: null,
    });
    const { getOrganisationChoices } = await import("@/server/clients/queries");

    const choices = await getOrganisationChoices(CLIENT_ID);

    expect(mocks.rpc).toHaveBeenCalledWith("list_organisations_for_transfer", {
      p_client_id: CLIENT_ID,
    });
    expect(choices).toEqual([
      { id: BANKSIA_ID, name: "Banksia Home Care", isCurrent: true },
      { id: WATTLE_ID, name: "Wattle Care", isCurrent: false },
    ]);
  });

  it("[FAM-13] throws, naming no client, when the database refuses", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: CLIENT_ID } });
    const { getOrganisationChoices } = await import("@/server/clients/queries");

    const rejection = getOrganisationChoices(CLIENT_ID);

    await expect(rejection).rejects.toThrow(
      "getOrganisationChoices: could not load organisations.",
    );
    await expect(rejection).rejects.not.toThrow(CLIENT_ID);
  });

  it("[FAM-13] with the mock data source it lists the fixture organisations, the current one flagged", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { getOrganisationChoices } = await import("@/server/clients/queries");

    const choices = await getOrganisationChoices("client-margaret");

    expect(choices.length).toBeGreaterThanOrEqual(2);
    expect(choices.filter((choice) => choice.isCurrent)).toHaveLength(1);
    expect(choices.find((choice) => choice.isCurrent)?.name).toBe("Banksia Home Care");
  });

  it("[FAM-13] with the mock data source an unknown client is an error, not an empty list", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { getOrganisationChoices } = await import("@/server/clients/queries");

    await expect(getOrganisationChoices("client-nobody")).rejects.toThrow();
  });
});
