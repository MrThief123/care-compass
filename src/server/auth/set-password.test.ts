// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  maybeSingle: vi.fn(),
  resolveMfaGatePath: vi.fn(),
  resolveRoleHomePath: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ origin: "http://localhost:3000" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  }),
}));
vi.mock("./routing", () => ({
  resolveMfaGatePath: mocks.resolveMfaGatePath,
  resolveRoleHomePath: mocks.resolveRoleHomePath,
  NO_CLIENT_LINKED_PATH: "/no-client-linked",
}));

import { requestPasswordReset, setPassword } from "./actions";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.maybeSingle.mockResolvedValue({
    data: { id: "u1", role: "carer", organisation_id: "o1", is_active: true },
  });
  mocks.resolveMfaGatePath.mockResolvedValue(null);
  mocks.resolveRoleHomePath.mockResolvedValue("/carer/home");
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
});

describe("[F0-24][AC-03] setPassword", () => {
  it("[F0-24][AC-03] sets the password for the invited session and returns the role home", async () => {
    const result = await setPassword({ password: "a long enough password" });
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "a long enough password" });
    expect(result).toEqual({ ok: true, data: { redirectTo: "/carer/home" } });
  });

  it("[F0-24][AC-03] rejects a password under 8 characters without calling Supabase", async () => {
    const result = await setPassword({ password: "short" });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-02] with no session (link expired or never opened) it asks for a new link", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const result = await setPassword({ password: "a long enough password" });
    expect(result).toMatchObject({ ok: false, error: { code: "UNEXPECTED" } });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-03] a failed update returns an error and no redirect", async () => {
    mocks.updateUser.mockResolvedValue({ error: new Error("weak") });
    const result = await setPassword({ password: "a long enough password" });
    expect(result.ok).toBe(false);
  });
});

describe("[F0-24][AC-06] requestPasswordReset gives no account-enumeration signal", () => {
  it("[F0-24][AC-06] returns the same result whether or not Supabase reports an error", async () => {
    const registered = await requestPasswordReset({ email: "known@example.test" });
    mocks.resetPasswordForEmail.mockResolvedValue({ error: new Error("User not found") });
    const unregistered = await requestPasswordReset({ email: "nobody@example.test" });
    expect(unregistered).toEqual(registered);
    expect(registered).toEqual({ ok: true, data: undefined });
  });
});
