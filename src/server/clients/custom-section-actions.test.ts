// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * F0-26 T-03: the add, update and remove Server Actions with the Supabase client faked. Each
 * awaited query takes the next queued result, so an action that writes and then checks whether
 * the row still exists can be driven step by step. RLS itself is covered in
 * supabase/tests/client_custom_sections.test.sql.
 */
type Result = { data?: unknown; error?: { code?: string; message: string } | null };

const mocks = vi.hoisted(() => {
  const calls: Array<[string, unknown[]]> = [];
  const state: { queue: Array<{ data?: unknown; error?: unknown }> } = { queue: [] };
  const builder: Record<string, unknown> = {};
  for (const method of [
    "from",
    "select",
    "eq",
    "order",
    "insert",
    "update",
    "delete",
    "single",
    "maybeSingle",
  ]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.then = (resolve: (value: unknown) => unknown) =>
    resolve(state.queue.shift() ?? { data: null, error: null });
  const getUser = vi.fn();
  const refreshCachedPages = vi.fn();
  return { calls, state, builder, getUser, refreshCachedPages };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const client = { ...mocks.builder };
    delete client.then;
    return { ...client, auth: { getUser: mocks.getUser } };
  },
}));
vi.mock("@/server/refresh-cache", () => ({ refreshCachedPages: mocks.refreshCachedPages }));

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const SECTION_ID = "c1111111-1111-1111-1111-111111111111";
const HELEN_ID = "a1111111-1111-1111-1111-111111111111";

const SHIFT_ENDED = "Your shift has ended, so changes can't be saved.";
const GONE = "This section no longer exists.";
const TAKEN = "There's already a section with that title. Choose another.";
const LIMIT = "This client already has 20 sections. Remove one to add another.";

function queue(...results: Result[]) {
  mocks.state.queue.push(...results);
}

function called(method: string) {
  return mocks.calls.filter(([name]) => name === method).map(([, args]) => args);
}

function wrote() {
  return called("insert").length + called("update").length + called("delete").length;
}

async function actions() {
  return import("@/server/clients/custom-section-actions");
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.calls.length = 0;
  mocks.state.queue.length = 0;
  mocks.getUser.mockResolvedValue({ data: { user: { id: HELEN_ID } } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[F0-26][AC-02] addClientCustomSection", () => {
  it("[F0-26][AC-02] inserts the trimmed title and text with the signed-in user as saver and returns the new id", async () => {
    queue({ data: { id: SECTION_ID }, error: null });
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(
      CLIENT_ID,
      "  Communication ",
      " Short sentences. ",
    );

    expect(result).toEqual({ ok: true, data: { id: SECTION_ID } });
    expect(called("from")).toContainEqual(["client_custom_info_sections"]);
    expect(called("insert")[0]![0]).toMatchObject({
      client_id: CLIENT_ID,
      title: "Communication",
      body: "Short sentences.",
      updated_by: HELEN_ID,
    });
    expect(mocks.refreshCachedPages).toHaveBeenCalled();
  });

  it("[F0-26][AC-02] stores blank text as null", async () => {
    queue({ data: { id: SECTION_ID }, error: null });
    const { addClientCustomSection } = await actions();

    await addClientCustomSection(CLIENT_ID, "Sleep", "   ");

    expect(called("insert")[0]![0]).toMatchObject({ body: null });
  });

  it("[F0-26][AC-03] refuses a built-in title before calling the database, naming the title field", async () => {
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(CLIENT_ID, "medical history", "x");

    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION", field: "title", message: TAKEN },
    });
    expect(wrote()).toBe(0);
    expect(mocks.refreshCachedPages).not.toHaveBeenCalled();
  });

  it("[F0-26][AC-03] refuses text over 5,000 characters, naming the text field", async () => {
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(CLIENT_ID, "Notes", "x".repeat(5001));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatchObject({ code: "VALIDATION", field: "content" });
    expect(wrote()).toBe(0);
  });

  it("[F0-26][AC-03] reports a title already used on the client (unique index) as a title error", async () => {
    queue({ data: null, error: { code: "23505", message: `duplicate for ${CLIENT_ID}` } });
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(CLIENT_ID, "Communication", "");

    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION", field: "title", message: TAKEN },
    });
  });

  it("[F0-26][AC-08] reports the database's 20-section limit with the limit message", async () => {
    queue({
      data: null,
      error: {
        code: "P0001",
        message: "client_custom_info_sections: custom section limit reached",
      },
    });
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(CLIENT_ID, "One too many", "");

    expect(result).toEqual({ ok: false, error: { code: "LIMIT", message: LIMIT } });
  });

  it("[F0-26][AC-14] reports an RLS refusal as NOT_ALLOWED with the shift-ended message", async () => {
    queue({ data: null, error: { code: "42501", message: `rls for ${CLIENT_ID}` } });
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(CLIENT_ID, "Sleep", "");

    expect(result).toEqual({ ok: false, error: { code: "NOT_ALLOWED", message: SHIFT_ENDED } });
  });

  it("[F0-26][AC-14] reports any other database error as UNEXPECTED, naming nothing", async () => {
    queue({ data: null, error: { code: "XX000", message: `broke for ${CLIENT_ID}` } });
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(CLIENT_ID, "Sleep", "");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNEXPECTED");
      expect(result.error.message).not.toContain(CLIENT_ID);
    }
  });

  it("[F0-26][AC-09] in mock mode nothing can change and it says so", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(CLIENT_ID, "Sleep", "");

    expect(result).toEqual({
      ok: false,
      error: { code: "NOT_AVAILABLE", message: "Saving changes is not available yet." },
    });
    expect(wrote()).toBe(0);
  });

  it("[F0-26][AC-09] a signed-out caller is not allowed and nothing is written", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection(CLIENT_ID, "Sleep", "");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");
    expect(wrote()).toBe(0);
  });

  it("[F0-26][AC-09] refuses a client id that is not a uuid and calls nothing", async () => {
    const { addClientCustomSection } = await actions();

    const result = await addClientCustomSection("client-margaret", "Sleep", "");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    expect(wrote()).toBe(0);
  });
});

describe("[F0-26][AC-04][AC-05] updateClientCustomSection", () => {
  it("[F0-26][AC-05] updates the title and text of that section of that client, with the saver", async () => {
    queue({ data: [{ id: SECTION_ID }], error: null });
    const { updateClientCustomSection } = await actions();

    const result = await updateClientCustomSection(CLIENT_ID, SECTION_ID, " Contacts ", " Helen ");

    expect(result).toEqual({ ok: true, data: undefined });
    expect(called("update")[0]![0]).toMatchObject({
      title: "Contacts",
      body: "Helen",
      updated_by: HELEN_ID,
    });
    expect(called("eq")).toContainEqual(["id", SECTION_ID]);
    expect(called("eq")).toContainEqual(["client_id", CLIENT_ID]);
    expect(mocks.refreshCachedPages).toHaveBeenCalled();
  });

  it("[F0-26][AC-03] reports a taken title as a title error", async () => {
    queue({ data: null, error: { code: "23505", message: "duplicate" } });
    const { updateClientCustomSection } = await actions();

    const result = await updateClientCustomSection(CLIENT_ID, SECTION_ID, "Sleep", "");

    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION", field: "title", message: TAKEN },
    });
  });

  it("[F0-26][AC-14] nothing updated and the section still readable: the shift ended", async () => {
    queue({ data: [], error: null }, { data: { id: SECTION_ID }, error: null });
    const { updateClientCustomSection } = await actions();

    const result = await updateClientCustomSection(CLIENT_ID, SECTION_ID, "Sleep", "");

    expect(result).toEqual({ ok: false, error: { code: "NOT_ALLOWED", message: SHIFT_ENDED } });
    expect(mocks.refreshCachedPages).not.toHaveBeenCalled();
  });

  it("[F0-26][AC-14] nothing updated and the section gone: removed by someone else", async () => {
    queue({ data: [], error: null }, { data: null, error: null });
    const { updateClientCustomSection } = await actions();

    const result = await updateClientCustomSection(CLIENT_ID, SECTION_ID, "Sleep", "");

    expect(result).toEqual({ ok: false, error: { code: "NOT_FOUND", message: GONE } });
  });

  it("[F0-26][AC-09] refuses a section id that is not a uuid and calls nothing", async () => {
    const { updateClientCustomSection } = await actions();

    const result = await updateClientCustomSection(CLIENT_ID, "section-1", "Sleep", "");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    expect(wrote()).toBe(0);
  });

  it("[F0-26][AC-09] in mock mode nothing can change", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { updateClientCustomSection } = await actions();

    const result = await updateClientCustomSection(CLIENT_ID, SECTION_ID, "Sleep", "");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_AVAILABLE");
  });
});

describe("[F0-26][AC-06] removeClientCustomSection", () => {
  it("[F0-26][AC-06] deletes that section of that client", async () => {
    queue({ data: [{ id: SECTION_ID }], error: null });
    const { removeClientCustomSection } = await actions();

    const result = await removeClientCustomSection(CLIENT_ID, SECTION_ID);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(called("delete")).toHaveLength(1);
    expect(called("eq")).toContainEqual(["id", SECTION_ID]);
    expect(called("eq")).toContainEqual(["client_id", CLIENT_ID]);
    expect(mocks.refreshCachedPages).toHaveBeenCalled();
  });

  it("[F0-26][AC-14] a section already removed by someone else counts as removed", async () => {
    queue({ data: [], error: null }, { data: null, error: null });
    const { removeClientCustomSection } = await actions();

    expect(await removeClientCustomSection(CLIENT_ID, SECTION_ID)).toEqual({
      ok: true,
      data: undefined,
    });
  });

  it("[F0-26][AC-14] nothing deleted and the section still readable: the shift ended", async () => {
    queue({ data: [], error: null }, { data: { id: SECTION_ID }, error: null });
    const { removeClientCustomSection } = await actions();

    expect(await removeClientCustomSection(CLIENT_ID, SECTION_ID)).toEqual({
      ok: false,
      error: { code: "NOT_ALLOWED", message: SHIFT_ENDED },
    });
  });

  it("[F0-26][AC-14] any database error is UNEXPECTED with a fixed message", async () => {
    queue({ data: null, error: { code: "XX000", message: `broke for ${CLIENT_ID}` } });
    const { removeClientCustomSection } = await actions();

    expect(await removeClientCustomSection(CLIENT_ID, SECTION_ID)).toEqual({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't remove the section. Try again." },
    });
  });

  it("[F0-26][AC-09] in mock mode nothing can change", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { removeClientCustomSection } = await actions();

    const result = await removeClientCustomSection(CLIENT_ID, SECTION_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_AVAILABLE");
    expect(wrote()).toBe(0);
  });
});
