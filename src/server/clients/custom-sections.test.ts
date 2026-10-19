// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * F0-26 T-02: `getClientCustomSections`, in mock mode (fixtures) and against a faked Supabase
 * client. The real database is covered in supabase/tests/client_custom_sections.test.sql.
 */
const mocks = vi.hoisted(() => {
  const calls: Array<[string, unknown[]]> = [];
  const state: { result: { data?: unknown; error?: unknown } } = {
    result: { data: [], error: null },
  };
  const builder: Record<string, unknown> = {};
  for (const method of ["from", "select", "eq", "order"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.then = (resolve: (value: unknown) => unknown) => resolve(state.result);
  return { calls, state, builder };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const client = { ...mocks.builder };
    delete client.then;
    return client;
  },
}));

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";

function called(method: string) {
  return mocks.calls.filter(([name]) => name === method).map(([, args]) => args);
}

beforeEach(() => {
  mocks.calls.length = 0;
  mocks.state.result = { data: [], error: null };
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[F0-26][AC-09] getClientCustomSections in mock mode", () => {
  beforeEach(() => vi.stubEnv("DATA_SOURCE", "mock"));

  it("[F0-26][AC-09] returns Robert's fixture sections, oldest first, for Robert only", async () => {
    const { getClientCustomSections } = await import("@/server/clients/custom-sections");

    const sections = await getClientCustomSections("client-robert");

    expect(sections.map((s) => s.title)).toEqual(["Communication", "Behaviours of concern"]);
    expect(sections.every((s) => s.clientId === "client-robert")).toBe(true);
  });

  it("[F0-26][AC-09] returns [] for Margaret (no custom sections) and for an unknown client", async () => {
    const { getClientCustomSections } = await import("@/server/clients/custom-sections");

    expect(await getClientCustomSections("client-margaret")).toEqual([]);
    expect(await getClientCustomSections("client-nobody")).toEqual([]);
  });

  it("[F0-26][AC-09] returns copies, so a caller can't change the fixtures", async () => {
    const { getClientCustomSections } = await import("@/server/clients/custom-sections");

    const first = await getClientCustomSections("client-robert");
    first[0]!.title = "Changed";

    expect((await getClientCustomSections("client-robert"))[0]!.title).toBe("Communication");
  });
});

describe("[F0-26][AC-09] getClientCustomSections against Supabase", () => {
  beforeEach(() => vi.stubEnv("DATA_SOURCE", "supabase"));

  it("[F0-26][AC-09] reads the client's rows oldest first and maps them, null text as ''", async () => {
    mocks.state.result = {
      error: null,
      data: [
        {
          id: "c1",
          client_id: CLIENT_ID,
          title: "Communication",
          body: "Short sentences.",
          updated_at: "2026-10-01T00:00:00Z",
        },
        {
          id: "c2",
          client_id: CLIENT_ID,
          title: "Sleep",
          body: null,
          updated_at: "2026-10-02T00:00:00Z",
        },
      ],
    };
    const { getClientCustomSections } = await import("@/server/clients/custom-sections");

    const sections = await getClientCustomSections(CLIENT_ID);

    expect(called("from")).toContainEqual(["client_custom_info_sections"]);
    expect(called("eq")).toContainEqual(["client_id", CLIENT_ID]);
    expect(called("order")[0]).toEqual(["created_at", { ascending: true }]);
    expect(sections).toEqual([
      {
        id: "c1",
        clientId: CLIENT_ID,
        title: "Communication",
        content: "Short sentences.",
        updatedAt: "2026-10-01T00:00:00Z",
      },
      {
        id: "c2",
        clientId: CLIENT_ID,
        title: "Sleep",
        content: "",
        updatedAt: "2026-10-02T00:00:00Z",
      },
    ]);
  });

  it("[F0-26][AC-09] returns [] when RLS shows nothing", async () => {
    const { getClientCustomSections } = await import("@/server/clients/custom-sections");

    expect(await getClientCustomSections(CLIENT_ID)).toEqual([]);
  });

  it("[F0-26][AC-14] rejects when the database errors, without the client id in the message", async () => {
    mocks.state.result = { data: null, error: { message: `broke for ${CLIENT_ID}` } };
    const { getClientCustomSections } = await import("@/server/clients/custom-sections");

    const error = await getClientCustomSections(CLIENT_ID).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(CLIENT_ID);
  });
});
