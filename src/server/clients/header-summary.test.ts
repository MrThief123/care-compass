// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * F0-20: the Supabase branches of `getClientHeaderSummary` and `assertClientAccess` with the
 * Supabase client faked. The real database is covered by
 * tests/integration/shared-client-header-wiring.test.ts.
 */
const mocks = vi.hoisted(() => {
  const state: { row: { data: unknown; error: unknown }; rpc: { data: unknown; error: unknown } } =
    { row: { data: null, error: null }, rpc: { data: [], error: null } };
  const calls: Array<[string, unknown[]]> = [];
  const builder: Record<string, unknown> = {};
  for (const method of ["from", "select", "eq"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.maybeSingle = () => {
    calls.push(["maybeSingle", []]);
    return Promise.resolve(state.row);
  };
  const rpc = vi.fn((...args: unknown[]) => {
    calls.push(["rpc", args]);
    return Promise.resolve(state.rpc);
  });
  const getLandingPath = vi.fn(async () => "/family/landing-client/home");
  return { state, calls, builder, rpc, getLandingPath };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ ...mocks.builder, rpc: mocks.rpc }),
}));
vi.mock("@/server/auth/queries", () => ({ getLandingPath: mocks.getLandingPath }));

import { assertClientAccess, getClientHeaderSummary } from "./queries";

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const ORG_ID = "c2222222-2222-2222-2222-222222222222";

const ROW = {
  id: CLIENT_ID,
  first_name: "Margaret",
  last_name: "Whitfield",
  date_of_birth: "1943-10-01",
  suburb: "Brunswick",
  organisation_id: ORG_ID,
};

const ORGANISATIONS = [
  { id: "d3333333-3333-3333-3333-333333333333", name: "Other Care", is_current: false },
  { id: ORG_ID, name: "Banksia Home Care", is_current: true },
];

function called(method: string) {
  return mocks.calls.filter(([name]) => name === method).map(([, args]) => args);
}

/** The path a redirect points at, as Next reports it: `NEXT_REDIRECT;replace;<url>;307;`. */
async function redirectTarget(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? "";
    expect(digest).toMatch(/^NEXT_REDIRECT;replace;/);
    return digest.split(";")[2]!;
  }
  throw new Error("expected a redirect");
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  vi.useFakeTimers({ toFake: ["Date"] });
  // 1 Oct 2026, noon in Melbourne.
  vi.setSystemTime(new Date("2026-10-01T02:00:00Z"));
  mocks.calls.length = 0;
  mocks.rpc.mockClear();
  mocks.getLandingPath.mockClear();
  mocks.state.row = { data: ROW, error: null };
  mocks.state.rpc = { data: ORGANISATIONS, error: null };
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("[F0-20][AC-01] getClientHeaderSummary (DATA_SOURCE=supabase)", () => {
  it("[F0-20][AC-01] returns the names, Melbourne age, suburb and current organisation name", async () => {
    await expect(getClientHeaderSummary(CLIENT_ID)).resolves.toEqual({
      id: CLIENT_ID,
      firstName: "Margaret",
      lastName: "Whitfield",
      age: 83,
      suburb: "Brunswick",
      organisationName: "Banksia Home Care",
    });
    expect(called("from")).toEqual([["clients"]]);
    expect(called("eq")).toEqual([["id", CLIENT_ID]]);
    expect(called("rpc")).toEqual([
      ["list_organisations_for_transfer", { p_client_id: CLIENT_ID }],
    ]);
  });

  it("[F0-20][AC-01] counts the birthday only once it has been reached in Melbourne", async () => {
    mocks.state.row = { data: { ...ROW, date_of_birth: "1943-10-02" }, error: null };
    await expect(getClientHeaderSummary(CLIENT_ID)).resolves.toMatchObject({ age: 82 });
  });
});

describe("[F0-20][AC-02] a client with missing details", () => {
  it("[F0-20][AC-02] omits suburb, age and organisation when none is stored, without throwing", async () => {
    mocks.state.row = {
      data: { ...ROW, date_of_birth: null, suburb: null, organisation_id: null },
      error: null,
    };
    mocks.state.rpc = {
      data: ORGANISATIONS.map((o) => ({ ...o, is_current: false })),
      error: null,
    };

    const summary = await getClientHeaderSummary(CLIENT_ID);

    expect(summary).toEqual({ id: CLIENT_ID, firstName: "Margaret", lastName: "Whitfield" });
    expect(summary).not.toHaveProperty("age");
    expect(summary).not.toHaveProperty("suburb");
    expect(summary).not.toHaveProperty("organisationName");
  });

  it("[F0-20][AC-02] skips the organisation lookup when the client has no organisation", async () => {
    mocks.state.row = { data: { ...ROW, organisation_id: null }, error: null };
    await getClientHeaderSummary(CLIENT_ID);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("[F0-20][AC-03] an unreadable client", () => {
  const GENERIC = "getClientHeaderSummary: could not load the client.";

  it("[F0-20][AC-03] throws a generic error when no row is readable (RLS hides it)", async () => {
    mocks.state.row = { data: null, error: null };
    await expect(getClientHeaderSummary(CLIENT_ID)).rejects.toThrow(GENERIC);
  });

  it("[F0-20][AC-03] throws the same error, without reading, for a malformed id", async () => {
    await expect(getClientHeaderSummary("not-a-uuid")).rejects.toThrow(GENERIC);
    expect(called("from")).toEqual([]);
  });

  it("[F0-20][AC-03] throws the same error on a database error, naming no client or date of birth", async () => {
    mocks.state.row = {
      data: null,
      error: { message: `failed for ${CLIENT_ID} Margaret 1943-10-01` },
    };
    const error = await getClientHeaderSummary(CLIENT_ID).catch((e: Error) => e);
    expect((error as Error).message).toBe(GENERIC);
    expect((error as Error).message).not.toMatch(/Margaret|1943|b1111111/);
  });
});

describe("[F0-20][AC-04] the organisation lookup fails", () => {
  it("[F0-20][AC-04] returns the rest of the header without an organisation name", async () => {
    mocks.state.rpc = { data: null, error: { message: "permission denied" } };

    const summary = await getClientHeaderSummary(CLIENT_ID);

    expect(summary).toMatchObject({ firstName: "Margaret", age: 83, suburb: "Brunswick" });
    expect(summary).not.toHaveProperty("organisationName");
  });
});

describe("[F0-20][AC-05][AC-07] assertClientAccess", () => {
  it("[F0-20][AC-05] returns without redirecting when the client is readable", async () => {
    mocks.state.row = { data: { id: CLIENT_ID }, error: null };
    await expect(assertClientAccess(CLIENT_ID)).resolves.toBeUndefined();
    expect(mocks.getLandingPath).not.toHaveBeenCalled();
    expect(called("from")).toEqual([["clients"]]);
    expect(called("eq")).toEqual([["id", CLIENT_ID]]);
  });

  it("[F0-20][AC-05] redirects to the landing path when no row is readable (not linked)", async () => {
    mocks.state.row = { data: null, error: null };
    await expect(redirectTarget(() => assertClientAccess(CLIENT_ID))).resolves.toBe(
      "/family/landing-client/home",
    );
  });

  it("[F0-20][AC-05] redirects for a malformed id without reading", async () => {
    await expect(redirectTarget(() => assertClientAccess("not-a-uuid"))).resolves.toBe(
      "/family/landing-client/home",
    );
    expect(called("from")).toEqual([]);
  });

  it("[F0-20][AC-07] follows the landing path to /no-client-linked for a family member with no client", async () => {
    mocks.getLandingPath.mockResolvedValueOnce("/no-client-linked");
    mocks.state.row = { data: null, error: null };
    await expect(redirectTarget(() => assertClientAccess(CLIENT_ID))).resolves.toBe(
      "/no-client-linked",
    );
  });

  it("[F0-20][AC-05] does not turn a database error into access: it redirects too", async () => {
    mocks.state.row = { data: null, error: { message: "boom" } };
    await expect(redirectTarget(() => assertClientAccess(CLIENT_ID))).resolves.toBe(
      "/family/landing-client/home",
    );
  });
});

describe("[F0-20][AC-08] DATA_SOURCE=mock", () => {
  it("[F0-20][AC-08] assertClientAccess does nothing and reads nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    await expect(assertClientAccess(CLIENT_ID)).resolves.toBeUndefined();
    expect(mocks.calls).toEqual([]);
    expect(mocks.getLandingPath).not.toHaveBeenCalled();
  });
});
