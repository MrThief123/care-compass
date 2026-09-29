// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * CAR-09 server actions with the Supabase client faked, so what is written and
 * which address the reset goes to can be checked exactly. The real database is
 * covered in tests/integration/carer-settings-profile.test.ts and
 * supabase/tests/carer_profile_update.test.sql.
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

const AISHA_ID = "a3333333-3333-3333-3333-333333333333";
const LOGIN_EMAIL = "aisha.login@example.com";

const VALID = {
  name: "Aisha Rahman",
  phone: "0423 987 654",
  email: "aisha.r@banksiahomecare.com.au",
};

beforeEach(() => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: AISHA_ID, email: LOGIN_EMAIL } } });
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.maybeSingle.mockResolvedValue({
    data: {
      id: AISHA_ID,
      first_name: "Aisha",
      last_name: "Rahman",
      phone: VALID.phone,
      email: VALID.email,
      job_title: "Registered Nurse",
    },
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[CAR-09][AC-05] updateCarerContactDetails validates on the server", () => {
  it("[CAR-09][AC-05] refuses a bad email, phone and empty name, each on its own field, and writes nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    const result = await updateCarerContactDetails({ name: "  ", phone: "12", email: "aisha@" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.fieldErrors).toMatchObject({
        name: "Enter your name.",
        phone: "Enter a phone number like 0412 345 678.",
        email: "Enter an email address like name@example.com.",
      });
    }
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("[CAR-09][AC-05] a non-object input is refused rather than thrown", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    const result = await updateCarerContactDetails(null as never);

    expect(result.ok).toBe(false);
  });

  it("[CAR-09][AC-05] refuses when nobody is signed in, and writes nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    const result = await updateCarerContactDetails(VALID);

    expect(result.ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("[CAR-09][AC-05] reports a database error with a generic message that carries no data", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "duplicate key value (aisha.r@banksiahomecare.com.au)", code: "23505" },
    });
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    const result = await updateCarerContactDetails(VALID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNEXPECTED");
      expect(result.error.message).not.toContain("banksiahomecare");
    }
  });
});

describe("[CAR-09][AC-04] updateCarerContactDetails saves the signed-in carer", () => {
  it("[CAR-09][AC-04] writes only first_name, last_name, phone and email, to the session user's own row", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    const result = await updateCarerContactDetails({ ...VALID, phone: "  0499 999 999 " });

    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.update).toHaveBeenCalledWith({
      first_name: "Aisha",
      last_name: "Rahman",
      phone: "0499 999 999",
      email: VALID.email,
    });
    expect(mocks.eq).toHaveBeenCalledWith("id", AISHA_ID);
    expect(result.ok).toBe(true);
  });

  it("[CAR-09][AC-02] never sends address, job title, role, organisation, active flag or an id from the caller", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    await updateCarerContactDetails({
      ...VALID,
      address: "1 Any St",
      job_title: "Nurse Practitioner",
      role: "admin",
      organisation_id: "x",
      is_active: false,
      id: "someone-else",
    } as never);

    const [payload] = mocks.update.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(Object.keys(payload).sort()).toEqual(["email", "first_name", "last_name", "phone"]);
    expect(mocks.eq).toHaveBeenCalledWith("id", AISHA_ID);
  });

  it("[CAR-09][AC-04] splits the name at the first space, so a joined name reads back the same", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    await updateCarerContactDetails({ ...VALID, name: "Mary Jane van der Berg" });
    expect(mocks.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ first_name: "Mary", last_name: "Jane van der Berg" }),
    );
  });

  it("[CAR-09][AC-04] stores a blank phone or email as null and returns the saved details with the role", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: AISHA_ID,
        first_name: "Aisha",
        last_name: "Rahman",
        phone: null,
        email: null,
        job_title: "Registered Nurse",
      },
      error: null,
    });
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    const result = await updateCarerContactDetails({ name: "Aisha Rahman", phone: "", email: "" });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null, email: null }),
    );
    expect(result).toEqual({
      ok: true,
      data: { profileId: AISHA_ID, name: "Aisha Rahman", role: "Registered Nurse" },
    });
  });

  it("[CAR-09][AC-04] reports a save that changed no row (RLS hid it) as a failure, not success", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    const result = await updateCarerContactDetails(VALID);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNEXPECTED");
  });

  it("[CAR-09][AC-04] with the mock data source it validates and echoes the values, and touches no database", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { updateCarerContactDetails } = await import("@/server/profiles/actions");

    const result = await updateCarerContactDetails(VALID);

    expect(result.ok).toBe(true);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("[CAR-09][AC-03] a carer's password reset", () => {
  it("[CAR-09][AC-03] goes to the login address from the session, not the contact email", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    const { requestOwnPasswordReset } = await import("@/server/profiles/actions");

    const result = await requestOwnPasswordReset();

    expect(result.ok).toBe(true);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledTimes(1);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(LOGIN_EMAIL, {
      redirectTo: "http://127.0.0.1:3000/auth/confirm?next=/reset-password",
    });
  });
});
