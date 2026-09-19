import { describe, expect, it } from "vitest";

import { selectEventDocuments } from "@/mocks/queries/documents";
import { EventDocumentSchema } from "@/types/domain";
import type { EventDocument } from "@/types/domain";

function document(overrides: Partial<EventDocument>): EventDocument {
  return {
    id: "doc-1",
    clientId: "client-a",
    eventId: "event-a1",
    name: "Chart.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    uploadedAt: "2026-10-01T10:00:00+11:00",
    ...overrides,
  };
}

describe("[UI-04][AC-06] EventDocument type", () => {
  it("[UI-04][AC-06] carries name, MIME type, size in bytes and upload details, and no link", () => {
    const parsed = EventDocumentSchema.parse({
      ...document({ uploadedBy: "Helen Doyle" }),
      url: "https://example.invalid/should-not-survive",
    });

    expect(parsed).toEqual(document({ uploadedBy: "Helen Doyle" }));
    expect("url" in parsed).toBe(false);
  });

  it("[UI-04][AC-06] rejects a negative or fractional size and a missing MIME type", () => {
    expect(EventDocumentSchema.safeParse(document({ sizeBytes: -1 })).success).toBe(false);
    expect(EventDocumentSchema.safeParse(document({ sizeBytes: 1.5 })).success).toBe(false);
    expect(EventDocumentSchema.safeParse({ ...document({}), mimeType: undefined }).success).toBe(
      false,
    );
  });
});

describe("[UI-04][AC-06] selectEventDocuments", () => {
  const first = document({ id: "doc-1", uploadedAt: "2026-10-01T10:00:00+11:00" });
  const second = document({
    id: "doc-2",
    name: "Second.pdf",
    uploadedAt: "2026-10-02T10:00:00+11:00",
  });
  const otherEvent = document({ id: "doc-3", eventId: "event-a2" });
  const otherClient = document({ id: "doc-4", clientId: "client-b", eventId: "event-b1" });
  const all = [otherClient, second, otherEvent, first];

  it("[UI-04][AC-06] returns the documents of that client's event, oldest upload first", () => {
    expect(selectEventDocuments(all, "client-a", "event-a1").map((item) => item.id)).toEqual([
      "doc-1",
      "doc-2",
    ]);
  });

  it("[UI-04][AC-06] orders by upload instant, not text, and breaks ties by id", () => {
    const utc = document({ id: "doc-z", uploadedAt: "2026-10-01T00:30:00Z" });
    const local = document({ id: "doc-y", uploadedAt: "2026-10-01T11:00:00+11:00" });
    const tiedB = document({ id: "doc-b", uploadedAt: "2026-10-03T10:00:00+11:00" });
    const tiedA = document({ id: "doc-a", uploadedAt: "2026-10-03T10:00:00+11:00" });

    const result = selectEventDocuments([tiedB, utc, tiedA, local], "client-a", "event-a1");

    // 11:00+11:00 is 00:00Z, so it is earlier than 00:30Z.
    expect(result.map((item) => item.id)).toEqual(["doc-y", "doc-z", "doc-a", "doc-b"]);
  });

  it("[UI-04][AC-06] returns an empty array for an event with no documents", () => {
    expect(selectEventDocuments(all, "client-a", "event-none")).toEqual([]);
  });

  it("[UI-04][AC-06] never returns another client's documents, even for a matching event id", () => {
    expect(selectEventDocuments(all, "client-b", "event-a1")).toEqual([]);
    expect(selectEventDocuments(all, "client-a", "event-b1")).toEqual([]);
    const sameEventIdOtherClient = document({ id: "doc-5", clientId: "client-b" });
    expect(
      selectEventDocuments([...all, sameEventIdOtherClient], "client-a", "event-a1").map(
        (item) => item.id,
      ),
    ).toEqual(["doc-1", "doc-2"]);
  });

  it("[UI-04][AC-06] does not reorder the array it is given", () => {
    const input = [...all];

    selectEventDocuments(input, "client-a", "event-a1");

    expect(input.map((item) => item.id)).toEqual(all.map((item) => item.id));
  });
});
