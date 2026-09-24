// @vitest-environment node
import { describe, expect, it } from "vitest";

import { CLIENT_INFO_SECTIONS, CLIENTS, MARGARET_CLIENT_ID } from "@/mocks/fixtures";
import { ClientInfoSectionSchema } from "@/types/domain";

describe("[FAM-UI-04][PRD] CLIENT_INFO_SECTIONS fixtures (CHG-018)", () => {
  it("[FAM-UI-04][PRD] every section is valid against the domain schema, and ids are unique", () => {
    CLIENT_INFO_SECTIONS.forEach((section) => ClientInfoSectionSchema.parse(section));

    const ids = CLIENT_INFO_SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("[FAM-UI-04][PRD] every section belongs to a fixture client, at most one per kind", () => {
    const clientIds = new Set(CLIENTS.map((client) => client.id));

    for (const section of CLIENT_INFO_SECTIONS) {
      expect(clientIds.has(section.clientId)).toBe(true);
    }

    const perClientAndKind = CLIENT_INFO_SECTIONS.map(
      (section) => `${section.clientId}:${section.kind}`,
    );
    expect(new Set(perClientAndKind).size).toBe(perClientAndKind.length);
  });

  it("[FAM-UI-04][PRD] Margaret has all three sections", () => {
    const kinds = CLIENT_INFO_SECTIONS.filter(
      (section) => section.clientId === MARGARET_CLIENT_ID,
    ).map((section) => section.kind);

    expect([...kinds].sort()).toEqual(["description", "habits", "medicalHistory"]);
  });
});
