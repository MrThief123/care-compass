// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_DOCUMENTS, MARGARET_CLIENT_ID } from "@/mocks/fixtures";
import { getEventDocuments } from "@/server/documents/queries";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[UI-04][AC-06] getEventDocuments", () => {
  it("[UI-04][AC-06] returns an empty array for an event with no documents", async () => {
    expect(await getEventDocuments(MARGARET_CLIENT_ID, "event-with-no-documents")).toEqual([]);
  });

  it("[UI-04][AC-06] returns every fixture document for its own client and event, and nothing else", async () => {
    for (const document of EVENT_DOCUMENTS) {
      const result = await getEventDocuments(document.clientId, document.eventId);

      expect(result).toContainEqual(document);
      expect(
        result.every(
          (item) => item.clientId === document.clientId && item.eventId === document.eventId,
        ),
      ).toBe(true);
    }
  });

  it("[UI-04][AC-06] never returns a document to a client it does not belong to", async () => {
    for (const document of EVENT_DOCUMENTS) {
      for (const otherClientId of ["client-does-not-exist", "client-jean", "client-robert"]) {
        if (otherClientId === document.clientId) continue;

        const result = await getEventDocuments(otherClientId, document.eventId);

        expect(result.some((item) => item.id === document.id)).toBe(false);
      }
    }
  });

  it("[UI-04][AC-06] object-prototype names are unknown clients and events, not errors", async () => {
    for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(await getEventDocuments(name, name)).toEqual([]);
    }
  });
});

describe("[UI-04][AC-07] supabase mode", () => {
  it("[UI-04][AC-07] getEventDocuments throws the not-implemented error naming its domain and function", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");

    await expect(getEventDocuments(MARGARET_CLIENT_ID, "any-event")).rejects.toThrow(
      /documents\.getEventDocuments: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});
