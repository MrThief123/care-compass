// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [F0-28] `getClientDetails` and `saveClientDetails` with the Supabase client faked, so the exact
 * read, the exact RPC call and the way each database error is reported can be checked; and the
 * same two in mock mode (AC-15). Real RLS: supabase/tests/client_details.test.sql and
 * tests/integration/shared-client-profile-details.test.ts.
 */
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  select: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: mocks.rpc,
    from: () => ({
      select: (columns: string) => {
        mocks.select(columns);
        const chain = { eq: () => chain, maybeSingle: mocks.maybeSingle };
        return chain;
      },
    }),
  }),
}));

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";

const ROW = {
  date_of_birth: "1952-03-02",
  email: "margaret@example.com",
  phone: "0400 111 222",
  address: "12 Banksia Street",
  suburb: "Brunswick",
  emergency_contact_name: "Helen Doyle",
  emergency_contact_relationship: "Daughter",
  emergency_contact_phone: "+61 400 333 444",
};

const DETAILS = {
  dateOfBirth: "1952-03-02",
  email: "margaret@example.com",
  phone: "0400 111 222",
  address: "12 Banksia Street",
  suburb: "Brunswick",
  emergencyContactName: "Helen Doyle",
  emergencyContactRelationship: "Daughter",
  emergencyContactPhone: "+61 400 333 444",
};

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: ROW, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[F0-28] getClientDetails", () => {
  it("[F0-28][AC-11] reads the eight columns and maps them to the details", async () => {
    const { getClientDetails } = await import("./client-details");
    expect(await getClientDetails(CLIENT_ID)).toEqual(DETAILS);
    expect(mocks.select).toHaveBeenCalledWith(
      "date_of_birth, email, phone, address, suburb, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone",
    );
  });

  it("[F0-28][AC-11] leaves out every field that is not set", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: Object.fromEntries(Object.keys(ROW).map((key) => [key, null])),
      error: null,
    });
    const { getClientDetails } = await import("./client-details");
    expect(await getClientDetails(CLIENT_ID)).toEqual({});
  });

  it("[F0-28][AC-15] an unreadable client, an error or a malformed id throws a message naming no client", async () => {
    const { getClientDetails } = await import("./client-details");
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(getClientDetails(CLIENT_ID)).rejects.toThrow(
      "getClientDetails: could not load the details.",
    );
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: { code: "XX000" } });
    await expect(getClientDetails(CLIENT_ID)).rejects.toThrow(/^getClientDetails: could not/);
    await expect(getClientDetails("client-margaret")).rejects.not.toThrow(/margaret/);
  });
});

describe("[F0-28] saveClientDetails", () => {
  it("[F0-28][AC-07] calls save_client_details once with every field, and refreshes pages", async () => {
    const { saveClientDetails } = await import("./client-details-actions");
    const result = await saveClientDetails(CLIENT_ID, { ...DETAILS, suburb: " Brunswick " });
    expect(result).toEqual({ ok: true, data: undefined });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("save_client_details", {
      p_client_id: CLIENT_ID,
      p_date_of_birth: "1952-03-02",
      p_email: "margaret@example.com",
      p_phone: "0400 111 222",
      p_address: "12 Banksia Street",
      p_suburb: "Brunswick",
      p_emergency_contact_name: "Helen Doyle",
      p_emergency_contact_relationship: "Daughter",
      p_emergency_contact_phone: "+61 400 333 444",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("[F0-28][AC-08] a blank or missing field is sent as null, which clears it", async () => {
    const { saveClientDetails } = await import("./client-details-actions");
    await saveClientDetails(CLIENT_ID, { phone: "0400 111 222", email: "" });
    expect(mocks.rpc).toHaveBeenCalledWith("save_client_details", {
      p_client_id: CLIENT_ID,
      p_date_of_birth: null,
      p_email: null,
      p_phone: "0400 111 222",
      p_address: null,
      p_suburb: null,
      p_emergency_contact_name: null,
      p_emergency_contact_relationship: null,
      p_emergency_contact_phone: null,
    });
  });

  it("[F0-28][AC-09] invalid input or a malformed client id is VALIDATION and calls nothing", async () => {
    const { saveClientDetails } = await import("./client-details-actions");
    const bad = await saveClientDetails(CLIENT_ID, { email: "not-an-email" });
    expect(bad).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    const badId = await saveClientDetails("client-margaret", DETAILS);
    expect(badId).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["42501", "NOT_ALLOWED"],
    ["23514", "VALIDATION"],
    ["XX000", "UNEXPECTED"],
  ])(
    "[F0-28][AC-10] a database error %s is reported as %s, in words that name nothing",
    async (dbCode, code) => {
      mocks.rpc.mockResolvedValue({
        data: null,
        error: { code: dbCode, message: `failed for client ${CLIENT_ID}` },
      });
      const { saveClientDetails } = await import("./client-details-actions");
      const result = await saveClientDetails(CLIENT_ID, DETAILS);
      expect(result).toMatchObject({ ok: false, error: { code } });
      if (!result.ok) expect(result.error.message).not.toContain(CLIENT_ID);
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );
});

describe("[F0-28][AC-15] mock mode", () => {
  it("[F0-28][AC-15] a save is what the next read returns, and the header follows the date of birth and suburb", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { CLIENTS } = await import("@/mocks/fixtures");
    const clientId = CLIENTS[0]!.id;
    const { getClientDetails } = await import("./client-details");
    const { saveClientDetails } = await import("./client-details-actions");
    const { getClientHeaderSummary } = await import("./queries");

    expect(await saveClientDetails(clientId, { ...DETAILS, address: "" })).toEqual({
      ok: true,
      data: undefined,
    });
    const { address: _address, ...withoutAddress } = DETAILS;
    expect(await getClientDetails(clientId)).toEqual(withoutAddress);
    expect((await getClientHeaderSummary(clientId)).suburb).toBe("Brunswick");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[F0-28][AC-15] an unknown client cannot be read or saved", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { getClientDetails } = await import("./client-details");
    const { saveClientDetails } = await import("./client-details-actions");
    await expect(getClientDetails("no-such-client")).rejects.toThrow();
    expect(await saveClientDetails("no-such-client", DETAILS)).toMatchObject({ ok: false });
  });
});
