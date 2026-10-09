import { describe, expect, it } from "vitest";

import type { ClientDocument } from "@/types/domain";

import { filterDocuments, sortDocuments } from "./documents-sort";

function doc(id: string, name: string, sizeBytes: number, uploadedAt: string, eventTitle?: string) {
  return {
    id,
    clientId: "c1",
    name,
    mimeType: "application/pdf",
    sizeBytes,
    uploadedAt,
    eventTitle,
  } satisfies ClientDocument;
}

const DOCS = [
  doc("a", "care plan.pdf", 300, "2026-10-02T00:00:00Z"),
  doc("b", "Medication 10.pdf", 100, "2026-10-03T00:00:00Z", "Morning medication"),
  doc("c", "Medication 2.pdf", 200, "2026-10-01T00:00:00Z"),
  doc("d", "Zebra.pdf", 200, "2026-10-01T00:00:00Z", "Physiotherapy"),
];
const ids = (list: ClientDocument[]) => list.map((d) => d.id);

describe("[F0-25][AC-05] filterDocuments", () => {
  it("[F0-25][AC-05] matches the name case-insensitively, trimmed", () => {
    expect(ids(filterDocuments(DOCS, "  CARE "))).toEqual(["a"]);
  });

  it("[F0-25][AC-05] matches the event title too", () => {
    expect(ids(filterDocuments(DOCS, "physio"))).toEqual(["d"]);
  });

  it("[F0-25][AC-05] an empty or blank query returns everything; no match returns []", () => {
    expect(filterDocuments(DOCS, "   ")).toHaveLength(4);
    expect(filterDocuments(DOCS, "zzz")).toEqual([]);
  });

  it("[F0-25][AC-05] treats regex characters literally", () => {
    expect(filterDocuments(DOCS, ".*")).toEqual([]);
  });
});

describe("[F0-25][AC-06] sortDocuments", () => {
  it("[F0-25][AC-06] name: case-insensitive and numeric-aware, both directions", () => {
    expect(ids(sortDocuments(DOCS, "name", "asc"))).toEqual(["a", "c", "b", "d"]);
    expect(ids(sortDocuments(DOCS, "name", "desc"))).toEqual(["d", "b", "c", "a"]);
  });

  it("[F0-25][AC-06] size: ties broken by name, ascending in both directions", () => {
    expect(ids(sortDocuments(DOCS, "size", "asc"))).toEqual(["b", "c", "d", "a"]);
    expect(ids(sortDocuments(DOCS, "size", "desc"))).toEqual(["a", "c", "d", "b"]);
  });

  it("[F0-25][AC-06] date added: newest first by default direction desc; ties broken by name", () => {
    expect(ids(sortDocuments(DOCS, "date", "desc"))).toEqual(["b", "a", "c", "d"]);
    expect(ids(sortDocuments(DOCS, "date", "asc"))).toEqual(["c", "d", "a", "b"]);
  });

  it("[F0-25][AC-06] does not change the array it is given", () => {
    const copy = [...DOCS];
    sortDocuments(DOCS, "name", "desc");
    expect(DOCS).toEqual(copy);
  });
});
