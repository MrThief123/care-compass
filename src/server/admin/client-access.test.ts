// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * ADM-11 AC-05 (FD-03): an admin opening a client RLS does not let them read gets the not-found
 * page, never a redirect and never data. `assertClientAccess` (Family's redirect) is unchanged.
 */
const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ eq: mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle }) }),
    }),
  }),
}));

import { assertAdminClientAccess } from "./client-access";

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[ADM-11][AC-05] assertAdminClientAccess", () => {
  it("[ADM-11][AC-05] returns when RLS lets the admin read the client", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: CLIENT_ID }, error: null });

    await expect(assertAdminClientAccess(CLIENT_ID)).resolves.toBeUndefined();
    expect(mocks.eq).toHaveBeenCalledWith("id", CLIENT_ID);
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("[ADM-11][AC-05] shows not-found when no row is readable (another organisation, removed, unknown)", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(assertAdminClientAccess(CLIENT_ID)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("[ADM-11][AC-05] shows not-found for a malformed id without querying", async () => {
    await expect(assertAdminClientAccess("not-a-uuid")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.maybeSingle).not.toHaveBeenCalled();
  });

  it("[ADM-11][AC-05] a database error is not-found, never access", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: "XX000", message: "boom" } });

    await expect(assertAdminClientAccess(CLIENT_ID)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("[ADM-11][AC-05] does nothing under DATA_SOURCE=mock (FD-06)", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    await expect(assertAdminClientAccess("anything")).resolves.toBeUndefined();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
