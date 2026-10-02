// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * F0-23 T-03: `linkDocumentsToEvent` (src/server/documents/actions.ts) with a stubbed Supabase
 * client. The database function itself is covered by supabase/tests/document_event_linking.test.sql
 * and the round trip by tests/integration/document-event-linking.test.ts.
 */
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn(), createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const DOC_A = "d1111111-1111-1111-1111-111111111111";
const DOC_B = "d2222222-2222-2222-2222-222222222222";
const DOC_C = "d3333333-3333-3333-3333-333333333333";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.createClient.mockResolvedValue({
    rpc: mocks.rpc,
    auth: { getUser: mocks.getUser },
  });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-helen" } } });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

async function link(input: unknown) {
  const { linkDocumentsToEvent } = await import("@/server/documents/actions");
  return linkDocumentsToEvent(input as { eventId: string; documentIds: string[] });
}

describe("[F0-23] linkDocumentsToEvent", () => {
  it("[F0-23][AC-06] T-03 calls link_document_to_event once per document with the event id and reports none failed", async () => {
    const result = await link({ eventId: EVENT_ID, documentIds: [DOC_A, DOC_B] });

    expect(result).toEqual({ ok: true, data: { failedIds: [] } });
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).toHaveBeenCalledWith("link_document_to_event", {
      p_document_id: DOC_A,
      p_event_id: EVENT_ID,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("link_document_to_event", {
      p_document_id: DOC_B,
      p_event_id: EVENT_ID,
    });
  });

  it("[F0-23][AC-07] T-03 a refused link is reported in failedIds and does not stop the others", async () => {
    mocks.rpc.mockImplementation(async (_name: string, args: { p_document_id: string }) =>
      args.p_document_id === DOC_B
        ? { data: null, error: { code: "42501", message: "refused" } }
        : { data: null, error: null },
    );

    const result = await link({ eventId: EVENT_ID, documentIds: [DOC_A, DOC_B, DOC_C] });

    expect(result).toEqual({ ok: true, data: { failedIds: [DOC_B] } });
    expect(mocks.rpc).toHaveBeenCalledTimes(3);
  });

  it("[F0-23][AC-07] T-03 a thrown error for one document is reported as failed, not thrown", async () => {
    mocks.rpc.mockRejectedValueOnce(new Error("network"));

    const result = await link({ eventId: EVENT_ID, documentIds: [DOC_A, DOC_B] });

    expect(result).toEqual({ ok: true, data: { failedIds: [DOC_A] } });
  });

  it("[F0-23][AC-06] T-03 an empty list makes no calls", async () => {
    const result = await link({ eventId: EVENT_ID, documentIds: [] });

    expect(result).toEqual({ ok: true, data: { failedIds: [] } });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[F0-23][AC-04] T-03 a malformed event or document id is a VALIDATION result and no call is made", async () => {
    const badEvent = await link({ eventId: "not-an-id", documentIds: [DOC_A] });
    const badDocument = await link({ eventId: EVENT_ID, documentIds: ["nope"] });

    for (const result of [badEvent, badDocument]) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[F0-23][AC-06] T-03 accepts seed-style ids that carry no RFC version bits", async () => {
    const result = await link({
      eventId: "e1111111-1111-1111-1111-111111111111",
      documentIds: ["d1111111-1111-1111-1111-111111111111"],
    });

    expect(result.ok).toBe(true);
  });

  it("[F0-23][AC-02] T-03 with no signed-in user it is NOT_ALLOWED and makes no call", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await link({ eventId: EVENT_ID, documentIds: [DOC_A] });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[F0-23][AC-06] T-03 in mock mode it is NOT_AVAILABLE and touches nothing", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    const result = await link({ eventId: EVENT_ID, documentIds: [DOC_A] });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_AVAILABLE");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("[F0-23][AC-07] T-03 failure messages carry no filename, id or database detail", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: `document ${DOC_A} refused for Margaret` },
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await link({ eventId: EVENT_ID, documentIds: [DOC_A] });

    expect(JSON.stringify(result)).not.toContain("Margaret");
    for (const call of spy.mock.calls) {
      expect(JSON.stringify(call)).not.toContain("Margaret");
    }
    spy.mockRestore();
  });
});
