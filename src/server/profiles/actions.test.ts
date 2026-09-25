// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * FAM-12 server actions with the Supabase client faked, so what is written and
 * which address the reset goes to can be checked exactly. The real database is
 * covered in tests/integration/family-settings-profile.test.ts and
 * supabase/tests/profiles_update.test.sql.
 */
const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ select: () => ({ maybeSingle }) }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  const getUser = vi.fn();
  const resetPasswordForEmail = vi.fn();
  return { maybeSingle, eq, update, from, getUser, resetPasswordForEmail };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: mocks.from,
    auth: { getUser: mocks.getUser, resetPasswordForEmail: mocks.resetPasswordForEmail },
  }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "127.0.0.1:3000", "x-forwarded-proto": "http" }),
}));

const HELEN_ID = "a1111111-1111-1111-1111-111111111111";
const LOGIN_EMAIL = "helen.login@example.com";

const VALID = {
  name: "Helen Doyle",
  phone: "0412 345 678",
  email: "helen@example.com",
  address: "12 Wattle St, Preston VIC",
};

beforeEach(() => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: HELEN_ID, email: LOGIN_EMAIL } } });
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.maybeSingle.mockResolvedValue({
    data: {
      id: HELEN_ID,
      first_name: "Helen",
      last_name: "Doyle",
      phone: VALID.phone,
      email: VALID.email,
      address: VALID.address,
    },
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[FAM-12][AC-02] updateFamilyContactDetails validates on the server", () => {
  it("[FAM-12][AC-02] refuses an invalid email with a message on the email field, and writes nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails({ ...VALID, email: "helen@" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.fieldErrors?.email).toBe("Enter an email address like name@example.com.");
    }
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("[FAM-12][AC-02] refuses an invalid phone and an empty name, each on its own field", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails({ ...VALID, name: "  ", phone: "12" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fieldErrors).toMatchObject({
        name: "Enter your name.",
        phone: "Enter a phone number like 0412 345 678.",
      });
    }
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("[FAM-12][AC-02] a non-object input is refused rather than thrown", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails(null as never);

    expect(result.ok).toBe(false);
  });
});

describe("[FAM-12][AC-01] updateFamilyContactDetails saves the signed-in profile", () => {
  it("[FAM-12][AC-01] updates only the contact columns of the session user's own row", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails({ ...VALID, phone: "  0499 999 999 " });

    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.update).toHaveBeenCalledWith({
      first_name: "Helen",
      last_name: "Doyle",
      phone: "0499 999 999",
      email: VALID.email,
      address: VALID.address,
    });
    // The row is the session's own, never one the caller names.
    expect(mocks.eq).toHaveBeenCalledWith("id", HELEN_ID);
    expect(result.ok).toBe(true);
  });

  it("[FAM-12][AC-01] never sends role, organisation or active flag", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    await updateFamilyContactDetails({
      ...VALID,
      role: "admin",
      organisation_id: "x",
      is_active: false,
      id: "someone-else",
    } as never);

    const [payload] = mocks.update.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(Object.keys(payload).sort()).toEqual([
      "address",
      "email",
      "first_name",
      "last_name",
      "phone",
    ]);
    expect(mocks.eq).toHaveBeenCalledWith("id", HELEN_ID);
  });

  it("[FAM-12][AC-01] splits the name at the first space, so a joined name reads back the same", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    await updateFamilyContactDetails({ ...VALID, name: "Mary Jane van der Berg" });
    expect(mocks.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ first_name: "Mary", last_name: "Jane van der Berg" }),
    );

    await updateFamilyContactDetails({ ...VALID, name: "Cher" });
    expect(mocks.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ first_name: "Cher", last_name: null }),
    );
  });

  it("[FAM-12][AC-01] stores a blank phone, email or address as null and returns the saved details", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: HELEN_ID,
        first_name: "Helen",
        last_name: "Doyle",
        phone: null,
        email: null,
        address: null,
      },
      error: null,
    });
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails({
      name: "Helen Doyle",
      phone: "",
      email: "",
      address: "",
    });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null, email: null, address: null }),
    );
    expect(result).toEqual({
      ok: true,
      data: { profileId: HELEN_ID, name: "Helen Doyle" },
    });
  });

  it("[FAM-12][AC-01] reports a save that changed no row (RLS hid it) as a failure, not success", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails(VALID);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNEXPECTED");
  });

  it("[FAM-12][AC-01] reports a database error with a generic message that carries no data", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "duplicate key value (helen@example.com)", code: "23505" },
    });
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails(VALID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNEXPECTED");
      expect(result.error.message).not.toContain("helen@example.com");
    }
  });

  it("[FAM-12][AC-01] refuses when nobody is signed in, and writes nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails(VALID);

    expect(result.ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("[FAM-12][AC-01] with the mock data source it validates and echoes the values, and touches no database", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { updateFamilyContactDetails } = await import("@/server/profiles/actions");

    const result = await updateFamilyContactDetails(VALID);

    expect(result.ok).toBe(true);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("[FAM-12][AC-03] requestOwnPasswordReset", () => {
  it("[FAM-12][AC-03] requests a reset email for the signed-in user's login address", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { requestOwnPasswordReset } = await import("@/server/profiles/actions");

    const result = await requestOwnPasswordReset();

    expect(result.ok).toBe(true);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledTimes(1);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(LOGIN_EMAIL, {
      redirectTo: "http://127.0.0.1:3000/auth/confirm?next=/reset-password",
    });
  });

  it("[FAM-12][AC-03] takes no address from the caller, so it can never email someone else", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { requestOwnPasswordReset } = await import("@/server/profiles/actions");

    await (requestOwnPasswordReset as (input?: unknown) => Promise<unknown>)("victim@example.com");

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(LOGIN_EMAIL, expect.anything());
  });

  it("[FAM-12][AC-03] fails without sending when nobody is signed in", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const { requestOwnPasswordReset } = await import("@/server/profiles/actions");

    const result = await requestOwnPasswordReset();

    expect(result.ok).toBe(false);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("[FAM-12][AC-03] with the mock data source it succeeds and sends nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { requestOwnPasswordReset } = await import("@/server/profiles/actions");

    const result = await requestOwnPasswordReset();

    expect(result.ok).toBe(true);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });
});
