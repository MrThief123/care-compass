// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * CAR-04 server pieces with the Supabase client faked: the section and document reads
 * (Family and Carer share them, FD-01) and `saveClientInfoSection`. The real database is
 * covered in supabase/tests/carer_client_info.test.sql and
 * tests/integration/carer-client-info.test.ts.
 */
type Result = { data?: unknown; error?: { code?: string; message: string } | null };

const mocks = vi.hoisted(() => {
  const calls: Array<[string, unknown[]]> = [];
  const state: { result: { data?: unknown; error?: unknown } } = {
    result: { data: [], error: null },
  };
  const builder: Record<string, unknown> = {};
  for (const method of [
    "from",
    "select",
    "eq",
    "is",
    "order",
    "upsert",
    "update",
    "insert",
    "maybeSingle",
    "single",
  ]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.then = (resolve: (value: unknown) => unknown) => resolve(state.result);
  const getUser = vi.fn();
  return { calls, state, builder, getUser };
});

vi.mock("@/lib/supabase/server", () => ({
  // `then` is left off the client itself: a thenable here would make `await createClient()`
  // resolve to the query result. Only the chained builder is awaited for a result.
  createClient: async () => {
    const client = { ...mocks.builder };
    delete client.then;
    return { ...client, auth: { getUser: mocks.getUser } };
  },
}));

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const AISHA_ID = "a3333333-3333-3333-3333-333333333333";
const SHIFT_ENDED = "Your shift has ended, so changes can't be saved.";

function setResult(result: Result) {
  mocks.state.result = result;
}

function called(method: string) {
  return mocks.calls.filter(([name]) => name === method).map(([, args]) => args);
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.calls.length = 0;
  setResult({ data: [], error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: AISHA_ID } } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[CAR-04][AC-08] getClientInfoSections against Supabase", () => {
  it("[CAR-04][AC-08] reads the client's rows and returns Description, Habits, Medical history in that order whatever order they arrive in", async () => {
    setResult({
      error: null,
      data: [
        {
          client_id: CLIENT_ID,
          key: "medical_history",
          body: "Hip replacement.",
          updated_at: "2026-09-03T00:00:00Z",
        },
        {
          client_id: CLIENT_ID,
          key: "description",
          body: "Lives alone.",
          updated_at: "2026-09-01T00:00:00Z",
        },
        {
          client_id: CLIENT_ID,
          key: "habits",
          body: "Tea at 7am.",
          updated_at: "2026-09-02T00:00:00Z",
        },
      ],
    });
    const { getClientInfoSections } = await import("@/server/clients/queries");

    const sections = await getClientInfoSections(CLIENT_ID);

    expect(called("from")).toContainEqual(["client_info_sections"]);
    expect(called("eq")).toContainEqual(["client_id", CLIENT_ID]);
    expect(sections.map((s) => [s.kind, s.title, s.content, s.clientId])).toEqual([
      ["description", "Description", "Lives alone.", CLIENT_ID],
      ["habits", "Habits", "Tea at 7am.", CLIENT_ID],
      ["medicalHistory", "Medical history", "Hip replacement.", CLIENT_ID],
    ]);
  });

  it("[CAR-04][AC-08] leaves out a section that was never written, and returns [] for a client RLS shows nothing of", async () => {
    setResult({
      error: null,
      data: [
        {
          client_id: CLIENT_ID,
          key: "habits",
          body: "Tea at 7am.",
          updated_at: "2026-09-02T00:00:00Z",
        },
      ],
    });
    const { getClientInfoSections } = await import("@/server/clients/queries");

    expect((await getClientInfoSections(CLIENT_ID)).map((s) => s.kind)).toEqual(["habits"]);

    setResult({ data: [], error: null });
    expect(await getClientInfoSections(CLIENT_ID)).toEqual([]);
  });

  it("[CAR-04][AC-09] rejects when the database errors, without the client id in the message", async () => {
    setResult({ data: null, error: { message: `boom for ${CLIENT_ID}` } });
    const { getClientInfoSections } = await import("@/server/clients/queries");

    const failure = await getClientInfoSections(CLIENT_ID).then(
      () => null,
      (error: Error) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    expect(failure!.message).not.toContain(CLIENT_ID);
  });
});

describe("[CAR-04][AC-08] getClientDocuments against Supabase", () => {
  it("[CAR-04][AC-08] asks for the client's own, non-detached documents, oldest first, and maps them", async () => {
    setResult({
      error: null,
      data: [
        {
          id: "d1",
          client_id: CLIENT_ID,
          event_id: null,
          filename: "Care plan.pdf",
          uploaded_at: "2026-08-01T09:00:00Z",
          uploader: { first_name: "Helen", last_name: "Doyle" },
        },
      ],
    });
    const { getClientDocuments } = await import("@/server/documents/queries");

    const documents = await getClientDocuments(CLIENT_ID);

    expect(called("from")).toContainEqual(["documents"]);
    expect(called("eq")).toContainEqual(["client_id", CLIENT_ID]);
    expect(called("is")).toContainEqual(["event_id", null]);
    expect(called("is")).toContainEqual(["detached_at", null]);
    expect(called("order")[0]).toEqual(["uploaded_at", { ascending: true }]);
    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      id: "d1",
      clientId: CLIENT_ID,
      name: "Care plan.pdf",
      uploadedAt: "2026-08-01T09:00:00Z",
      uploadedBy: "Helen Doyle",
    });
    expect(typeof documents[0]!.url).toBe("string");
  });
});

describe("[CAR-04][AC-02] saveClientInfoSection", () => {
  it("[CAR-04][AC-02] upserts the client's section with the text, trimmed, and the signed-in user as saver", async () => {
    const { saveClientInfoSection } = await import("@/server/clients/actions");

    const result = await saveClientInfoSection(CLIENT_ID, "medicalHistory", "  Hip replacement.  ");

    expect(result).toEqual({ ok: true, data: undefined });
    expect(called("from")).toContainEqual(["client_info_sections"]);
    const [row, options] = called("upsert")[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(row).toMatchObject({
      client_id: CLIENT_ID,
      key: "medical_history",
      body: "Hip replacement.",
      updated_by: AISHA_ID,
    });
    expect(options).toMatchObject({ onConflict: "client_id,key" });
  });

  it("[CAR-04][AC-02] in mock mode nothing can change and it says so", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { saveClientInfoSection } = await import("@/server/clients/actions");

    const result = await saveClientInfoSection(CLIENT_ID, "habits", "Tea");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_AVAILABLE");
    expect(called("upsert")).toHaveLength(0);
  });

  it("[CAR-04][AC-06] refuses more than 5,000 characters before calling the database", async () => {
    const { saveClientInfoSection } = await import("@/server/clients/actions");

    const result = await saveClientInfoSection(CLIENT_ID, "habits", "x".repeat(5001));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.message).toMatch(/5,000/);
    }
    expect(called("upsert")).toHaveLength(0);
  });

  it("[CAR-04][AC-06] accepts exactly 5,000 characters", async () => {
    const { saveClientInfoSection } = await import("@/server/clients/actions");

    expect((await saveClientInfoSection(CLIENT_ID, "habits", "x".repeat(5000))).ok).toBe(true);
  });

  it.each([
    ["a client id that is not a uuid", "client-margaret", "habits"],
    ["a section that does not exist", CLIENT_ID, "budget"],
  ])("[CAR-04][AC-06] refuses %s and calls nothing", async (_label, clientId, kind) => {
    const { saveClientInfoSection } = await import("@/server/clients/actions");

    const result = await saveClientInfoSection(clientId, kind as never, "text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    expect(called("upsert")).toHaveLength(0);
  });

  it("[CAR-04][AC-05] reports an RLS refusal as NOT_ALLOWED with the shift-ended message, naming nothing", async () => {
    setResult({
      data: null,
      error: { code: "42501", message: `new row violates row-level security for ${CLIENT_ID}` },
    });
    const { saveClientInfoSection } = await import("@/server/clients/actions");

    const result = await saveClientInfoSection(CLIENT_ID, "habits", "Late change");

    expect(result).toEqual({
      ok: false,
      error: { code: "NOT_ALLOWED", message: SHIFT_ENDED },
    });
  });

  it("[CAR-04][AC-05] reports any other database error as UNEXPECTED, naming nothing", async () => {
    setResult({ data: null, error: { code: "XX000", message: `broke for ${CLIENT_ID}` } });
    const { saveClientInfoSection } = await import("@/server/clients/actions");

    const result = await saveClientInfoSection(CLIENT_ID, "habits", "Late change");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNEXPECTED");
      expect(result.error.message).not.toContain(CLIENT_ID);
    }
  });

  it("[CAR-04][AC-05] a signed-out caller is not allowed and nothing is written", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const { saveClientInfoSection } = await import("@/server/clients/actions");

    const result = await saveClientInfoSection(CLIENT_ID, "habits", "x");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");
    expect(called("upsert")).toHaveLength(0);
  });
});
