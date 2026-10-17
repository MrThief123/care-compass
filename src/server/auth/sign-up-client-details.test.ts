// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [F0-28] The optional client details in `signUp` (FD-02): after `register_account` creates the
 * client, any details given are saved with `save_client_details` for the new client id. Without
 * details sign-up is unchanged (AC-02); if saving them fails the account stays (AC-05). Supabase
 * is faked; the real flow is in tests/integration/shared-client-profile-details.test.ts.
 */
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  authSignUp: vi.fn(),
  signOut: vi.fn(),
  consoleError: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signUp: mocks.authSignUp, signOut: mocks.signOut },
    rpc: mocks.rpc,
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({
          data: { id: USER_ID, role: "family", organisation_id: null },
          error: null,
        }),
      };
      return chain;
    },
  }),
}));
vi.mock("./routing", () => ({
  resolveMfaGatePath: async () => null,
  resolveRoleHomePath: async () => `/family/${CLIENT_ID}/home`,
}));

const USER_ID = "a1111111-1111-1111-1111-111111111111";
const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";

const family = {
  accountType: "family",
  firstName: "Helen",
  lastName: "Doyle",
  email: "helen@example.com",
  password: "secret123",
  confirmPassword: "secret123",
  clientFirstName: "Margaret",
  clientLastName: "Doyle",
};

function rpcCalls(name: string) {
  return mocks.rpc.mock.calls.filter(([fn]) => fn === name);
}

beforeEach(() => {
  mocks.authSignUp.mockResolvedValue({
    data: { user: { id: USER_ID, identities: [{}] }, session: {} },
    error: null,
  });
  mocks.rpc.mockImplementation(async (fn: string) =>
    fn === "register_account"
      ? { data: { role: "family", profile_id: USER_ID, client_id: CLIENT_ID }, error: null }
      : { data: null, error: null },
  );
  vi.spyOn(console, "error").mockImplementation(mocks.consoleError);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("[F0-28] signUp with client details", () => {
  it("[F0-28][AC-02] with no details, only register_account is called, as before", async () => {
    const { signUp } = await import("./actions");
    const result = await signUp(family);
    expect(result).toEqual({ ok: true, data: { redirectTo: `/family/${CLIENT_ID}/home` } });
    expect(rpcCalls("register_account")).toHaveLength(1);
    expect(rpcCalls("save_client_details")).toHaveLength(0);
  });

  it("[F0-28][AC-03] with details, they are saved for the new client", async () => {
    const { signUp } = await import("./actions");
    const result = await signUp({
      ...family,
      clientDateOfBirth: "1952-03-02",
      clientPhone: "0400 111 222",
      clientSuburb: "Brunswick",
      clientEmergencyContactName: "Helen Doyle",
    });
    expect(result.ok).toBe(true);
    expect(rpcCalls("save_client_details")).toEqual([
      [
        "save_client_details",
        {
          p_client_id: CLIENT_ID,
          p_date_of_birth: "1952-03-02",
          p_email: null,
          p_phone: "0400 111 222",
          p_address: null,
          p_suburb: "Brunswick",
          p_emergency_contact_name: "Helen Doyle",
          p_emergency_contact_relationship: null,
          p_emergency_contact_phone: null,
        },
      ],
    ]);
  });

  it("[F0-28][AC-04] an invalid detail is a field error and nothing is created", async () => {
    const { signUp } = await import("./actions");
    const result = await signUp({ ...family, clientEmail: "not-an-email", clientPhone: "call" });
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION",
        fieldErrors: {
          clientEmail: "Enter a valid email address.",
          clientPhone: "Enter a valid phone number.",
        },
      },
    });
    expect(mocks.authSignUp).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[F0-28][AC-05] if saving the details fails, the account stays and sign-up still succeeds", async () => {
    mocks.rpc.mockImplementation(async (fn: string) =>
      fn === "register_account"
        ? { data: { role: "family", profile_id: USER_ID, client_id: CLIENT_ID }, error: null }
        : { data: null, error: { code: "XX000", message: "Margaret could not be saved" } },
    );
    const { signUp } = await import("./actions");
    const result = await signUp({ ...family, clientSuburb: "Brunswick" });
    expect(result).toEqual({ ok: true, data: { redirectTo: `/family/${CLIENT_ID}/home` } });
    expect(rpcCalls("discard_unregistered_account")).toHaveLength(0);
    expect(mocks.signOut).not.toHaveBeenCalled();
    // A feature tag only: no name, no details.
    expect(JSON.stringify(mocks.consoleError.mock.calls)).not.toMatch(/Margaret|Brunswick/);
  });

  it("[F0-28][AC-01] organisation sign-up ignores client details", async () => {
    mocks.rpc.mockImplementation(async () => ({
      data: { role: "admin", profile_id: USER_ID, client_id: null },
      error: null,
    }));
    const { signUp } = await import("./actions");
    // The organisation schema strips the client keys, the details among them.
    await signUp({
      ...family,
      accountType: "organisation",
      organisationName: "Banksia Home Care",
      clientSuburb: "Brunswick",
    });
    expect(rpcCalls("save_client_details")).toHaveLength(0);
  });
});
