// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [F0-29] The tag contracts in mock mode (the rules every source follows), and the Supabase
 * branches with the client faked so the exact read, RPC call and error mapping can be checked
 * (AC-14). Real RLS: supabase/tests/tags.test.sql and tests/integration/shared-event-document-tags.test.ts.
 */
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  rows: vi.fn(),
  insertSingle: vi.fn(),
  from: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: mocks.rpc,
    from: (table: string) => {
      mocks.from(table);
      const chain = {
        select: () => chain,
        eq: () => chain,
        is: () => chain,
        order: () => chain,
        insert: () => ({ select: () => ({ single: mocks.insertSingle }) }),
        then: (resolve: (value: unknown) => void, reject: (reason: unknown) => void) =>
          Promise.resolve(mocks.rows(table)).then(resolve, reject),
      };
      return chain;
    },
  }),
}));

const MARGARET = "client-margaret";
const ROBERT = "client-robert";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
  vi.resetModules();
});

describe("[F0-29] tag contracts (mock)", () => {
  beforeEach(() => vi.stubEnv("DATA_SOURCE", "mock"));

  it("[F0-29][AC-14] a client's tags, A to Z; a client with none, or unknown, has []", async () => {
    const { getClientTags } = await import("./queries");
    expect(await getClientTags(MARGARET)).toEqual(["Doctors", "Medication", "Therapy"]);
    expect(await getClientTags(ROBERT)).toEqual([]);
    expect(await getClientTags("constructor")).toEqual([]);
  });

  it("[F0-29][AC-14] an event's tags; another client's event has none", async () => {
    const { getEventTags, getEventTagsByClient } = await import("./queries");
    expect(await getEventTags(MARGARET, "event-margaret-med-review")).toEqual([
      "Doctors",
      "Medication",
    ]);
    expect(await getEventTags(ROBERT, "event-margaret-med-review")).toEqual([]);
    const byEvent = await getEventTagsByClient(MARGARET);
    expect(byEvent["event-margaret-physio"]).toEqual(["Therapy"]);
    expect(await getEventTagsByClient(ROBERT)).toEqual({});
  });

  it("[F0-29][AC-10] documents' tags by id, for one client only", async () => {
    const { getDocumentTagsByClient } = await import("./queries");
    const byDocument = await getDocumentTagsByClient(MARGARET);
    expect(byDocument["doc-margaret-physio-referral"]).toEqual(["Doctors", "Therapy"]);
    expect(await getDocumentTagsByClient(ROBERT)).toEqual({});
  });

  it("[F0-29][AC-01] createEvent saves its tags and a new name joins the client's tags", async () => {
    const { createEvent } = await import("@/server/events/actions");
    const { getClientTags, getEventTags } = await import("./queries");
    const result = await createEvent({
      clientId: MARGARET,
      title: "Dentist check-up",
      description: "",
      date: "2026-12-02",
      startTime: "10:00",
      durationMinutes: 30,
      recurrence: "none",
      isTask: true,
      tags: ["doctors", "Dentist"],
    });
    expect(result.ok).toBe(true);
    const eventId = result.ok ? result.data.eventId : "";
    // "doctors" is the existing "Doctors", not a second tag.
    expect(await getEventTags(MARGARET, eventId)).toEqual(["Dentist", "Doctors"]);
    expect(await getClientTags(MARGARET)).toEqual(["Dentist", "Doctors", "Medication", "Therapy"]);
  });

  it("[F0-29][AC-02][AC-04] updateEvent replaces the tags; without `tags` they stay", async () => {
    const { updateEvent } = await import("@/server/events/actions");
    const { getEventTags } = await import("./queries");
    const base = {
      clientId: MARGARET,
      eventId: "event-margaret-med-review",
      occurrenceOriginalStart: "2026-09-05T10:00:00+10:00",
      title: "Medication review",
      description: "",
      date: "2026-09-05",
      startTime: "10:00",
      durationMinutes: 30,
      recurrence: "fortnightly" as const,
      isTask: true,
      scope: "series" as const,
    };
    expect((await updateEvent(base)).ok).toBe(true);
    expect(await getEventTags(MARGARET, "event-margaret-med-review")).toEqual([
      "Doctors",
      "Medication",
    ]);
    expect((await updateEvent({ ...base, tags: [] })).ok).toBe(true);
    expect(await getEventTags(MARGARET, "event-margaret-med-review")).toEqual([]);
  });

  it("[F0-29][AC-11] setDocumentTags replaces a document's tags", async () => {
    const { setDocumentTags } = await import("./actions");
    const { getDocumentTagsByClient } = await import("./queries");
    const result = await setDocumentTags(MARGARET, "doc-margaret-care-plan", ["Doctors"]);
    expect(result).toEqual({ ok: true, data: undefined });
    expect((await getDocumentTagsByClient(MARGARET))["doc-margaret-care-plan"]).toEqual([
      "Doctors",
    ]);
  });

  it("[F0-29][AC-03] setDocumentTags refuses invalid names", async () => {
    const { setDocumentTags } = await import("./actions");
    const result = await setDocumentTags(MARGARET, "doc-margaret-care-plan", ["x".repeat(31)]);
    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION", message: "Check the tags and try again." },
    });
  });

  it("[F0-29][AC-07] getTaskLog({ tag }) lists only that tag's events, in any case, over every page", async () => {
    const { getTaskLog } = await import("@/server/events/queries");
    const all = await getTaskLog(MARGARET);
    const medication = await getTaskLog(MARGARET, { tag: "medication" });
    const medicationEvents = new Set([
      "event-margaret-med-review",
      "event-margaret-morning-meds",
      "event-margaret-evening-meds",
    ]);
    // The whole unfiltered history, page by page, counted by hand.
    let expected = 0;
    for (let page = 1; (page - 1) * all.pageSize < all.total; page++) {
      const rows = (await getTaskLog(MARGARET, { page })).items;
      expected += rows.filter((row) => medicationEvents.has(row.eventId)).length;
    }
    expect(medication.total).toBe(expected);
    expect(medication.total).toBeGreaterThan(0);
    expect(medication.total).toBeLessThan(all.total);
    expect(medication.items.every((row) => medicationEvents.has(row.eventId))).toBe(true);
  });

  it("[F0-29][AC-09] a tag no event has gives an empty log; a bad tag is rejected", async () => {
    const { getTaskLog } = await import("@/server/events/queries");
    expect((await getTaskLog(MARGARET, { tag: "Nobody uses this" })).total).toBe(0);
    await expect(getTaskLog(MARGARET, { tag: "x".repeat(31) })).rejects.toThrow();
  });
});

describe("[F0-29] tag contracts (Supabase, faked)", () => {
  const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
  const DOCUMENT_ID = "d1111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    mocks.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("[F0-29][AC-14] getClientTags reads client_tags and sorts A to Z", async () => {
    mocks.rows.mockReturnValue({
      data: [{ name: "therapy" }, { name: "Doctors" }, { name: "Medication" }],
      error: null,
    });
    const { getClientTags } = await import("./queries");
    expect(await getClientTags(CLIENT_ID)).toEqual(["Doctors", "Medication", "therapy"]);
    expect(mocks.from).toHaveBeenCalledWith("client_tags");
  });

  it("[F0-29][AC-14] a read error throws a message naming no client", async () => {
    mocks.rows.mockReturnValue({ data: null, error: { message: "client Margaret Doyle" } });
    const { getClientTags } = await import("./queries");
    await expect(getClientTags(CLIENT_ID)).rejects.toThrow(
      "getClientTags: could not load the tags.",
    );
  });

  it("[F0-29][AC-11] setDocumentTags calls set_document_tags with the cleaned names", async () => {
    const { setDocumentTags } = await import("./actions");
    expect(await setDocumentTags(CLIENT_ID, DOCUMENT_ID, [" Doctors ", "doctors"])).toEqual({
      ok: true,
      data: undefined,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("set_document_tags", {
      p_document_id: DOCUMENT_ID,
      p_names: ["Doctors"],
    });
  });

  it("[F0-29][AC-05][AC-13] maps a refusal and a failure to fixed messages", async () => {
    const { setDocumentTags } = await import("./actions");
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "Margaret" } });
    expect(await setDocumentTags(CLIENT_ID, DOCUMENT_ID, ["Doctors"])).toEqual({
      ok: false,
      error: { code: "NOT_ALLOWED", message: "Only the client's family can change tags." },
    });
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "XX000", message: "Margaret" } });
    expect(await setDocumentTags(CLIENT_ID, DOCUMENT_ID, ["Doctors"])).toEqual({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save the tags. Try again." },
    });
  });

  it("[F0-29][AC-01] createEvent saves tags through set_event_tags after the event", async () => {
    mocks.insertSingle.mockResolvedValue({
      data: { id: "e1111111-1111-1111-1111-111111111111" },
      error: null,
    });
    const { createEvent } = await import("@/server/events/actions");
    const result = await createEvent({
      clientId: CLIENT_ID,
      title: "GP visit",
      description: "",
      date: "2026-12-02",
      startTime: "10:00",
      durationMinutes: 30,
      recurrence: "none",
      isTask: true,
      tags: ["Doctors"],
    });
    expect(result).toEqual({ ok: true, data: { eventId: "e1111111-1111-1111-1111-111111111111" } });
    expect(mocks.rpc).toHaveBeenCalledWith("set_event_tags", {
      p_event_id: "e1111111-1111-1111-1111-111111111111",
      p_names: ["Doctors"],
    });
  });

  it("[F0-29][AC-04] createEvent without tags does not call set_event_tags", async () => {
    mocks.insertSingle.mockResolvedValue({
      data: { id: "e1111111-1111-1111-1111-111111111111" },
      error: null,
    });
    const { createEvent } = await import("@/server/events/actions");
    await createEvent({
      clientId: CLIENT_ID,
      title: "GP visit",
      description: "",
      date: "2026-12-02",
      startTime: "10:00",
      durationMinutes: 30,
      recurrence: "none",
      isTask: true,
    });
    expect(mocks.rpc).not.toHaveBeenCalledWith("set_event_tags", expect.anything());
  });

  it("[F0-29][AC-06] the event saves but its tags do not: says so", async () => {
    mocks.insertSingle.mockResolvedValue({
      data: { id: "e1111111-1111-1111-1111-111111111111" },
      error: null,
    });
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "boom" } });
    const { createEvent } = await import("@/server/events/actions");
    const result = await createEvent({
      clientId: CLIENT_ID,
      title: "GP visit",
      description: "",
      date: "2026-12-02",
      startTime: "10:00",
      durationMinutes: 30,
      recurrence: "none",
      isTask: true,
      tags: ["Doctors"],
    });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "UNEXPECTED",
        message: "The event was saved, but its tags weren't. Open the event and add them again.",
      },
    });
  });
});
