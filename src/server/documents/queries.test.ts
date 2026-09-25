// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_DOCUMENTS, MARGARET_CLIENT_ID } from "@/mocks/fixtures";
import { getClientDocuments, getEventDocuments } from "@/server/documents/queries";

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

describe("[FAM-UI-04][AC-03] getClientDocuments", () => {
  it("[FAM-UI-04][AC-03] returns Care plan.pdf then Medication schedule.pdf for Margaret", async () => {
    const documents = await getClientDocuments(MARGARET_CLIENT_ID);

    expect(documents.map((document) => document.name)).toEqual([
      "Care plan.pdf",
      "Medication schedule.pdf",
    ]);
  });

  it("[FAM-UI-04][AC-03] returns client-level documents only, none attached to an event", async () => {
    const documents = await getClientDocuments(MARGARET_CLIENT_ID);

    expect(documents.every((document) => document.eventId === undefined)).toBe(true);
    expect(documents.every((document) => document.clientId === MARGARET_CLIENT_ID)).toBe(true);
  });

  it("[FAM-UI-04][PRD] never returns another client's documents, and [] for an unknown client", async () => {
    expect(await getClientDocuments("client-does-not-exist")).toEqual([]);

    const all = await getClientDocuments(MARGARET_CLIENT_ID);
    for (const otherClientId of ["client-jean", "client-robert"]) {
      const result = await getClientDocuments(otherClientId);

      expect(result.some((item) => all.some((own) => own.id === item.id))).toBe(false);
    }
  });

  it("[FAM-UI-04][PRD] object-prototype names are unknown clients, not errors", async () => {
    for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(await getClientDocuments(name)).toEqual([]);
    }
  });

  it("[FAM-UI-04][PRD] does not let a caller change the fixtures by editing what it was given", async () => {
    const first = await getClientDocuments(MARGARET_CLIENT_ID);
    first[0]!.name = "changed.pdf";
    first.reverse();

    const second = await getClientDocuments(MARGARET_CLIENT_ID);

    expect(second.map((document) => document.name)).toEqual([
      "Care plan.pdf",
      "Medication schedule.pdf",
    ]);
  });
});

describe("[FAM-UI-04][PRD] getClientDocuments supabase mode", () => {
  it("[FAM-UI-04][PRD] throws the not-implemented error naming its domain and function", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");

    await expect(getClientDocuments(MARGARET_CLIENT_ID)).rejects.toThrow(
      /documents\.getClientDocuments: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});
