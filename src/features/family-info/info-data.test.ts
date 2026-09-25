import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientInfoSection, DocumentRef } from "@/types/domain";

import { loadFamilyInfoData } from "./info-data";

const mocks = vi.hoisted(() => ({
  getClientHeaderSummary: vi.fn(),
  getClientInfoSections: vi.fn(),
  getClientDocuments: vi.fn(),
}));

vi.mock("@/server/clients/queries", () => ({
  getClientHeaderSummary: mocks.getClientHeaderSummary,
  getClientInfoSections: mocks.getClientInfoSections,
}));
vi.mock("@/server/documents/queries", () => ({
  getClientDocuments: mocks.getClientDocuments,
}));

const CLIENT_ID = "client-margaret";

const HEADER = {
  id: CLIENT_ID,
  firstName: "Margaret",
  lastName: "Doyle",
  age: 78,
  suburb: "Preston VIC",
  organisationName: "Banksia Home Care",
};

const SECTION: ClientInfoSection = {
  id: "info-habits",
  clientId: CLIENT_ID,
  kind: "habits",
  title: "Habits",
  content: "Enjoys gardening.",
  updatedAt: "2026-09-01T10:00:00+10:00",
};

const DOCUMENT: DocumentRef = {
  id: "doc-care-plan",
  clientId: CLIENT_ID,
  name: "Care plan.pdf",
  url: "/files/doc-care-plan",
  uploadedAt: "2026-08-01T09:00:00+10:00",
};

beforeEach(() => {
  mocks.getClientHeaderSummary.mockResolvedValue(HEADER);
  mocks.getClientInfoSections.mockResolvedValue([SECTION]);
  mocks.getClientDocuments.mockResolvedValue([DOCUMENT]);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("[FAM-UI-04][PRD] loadFamilyInfoData", () => {
  it("[FAM-UI-04][AC-01] gathers the sections and documents, and nothing else", async () => {
    const data = await loadFamilyInfoData(CLIENT_ID);

    // No client name, last name or date of birth: the shell header shows the client (FD-08).
    expect(data).toEqual({ sections: [SECTION], documents: [DOCUMENT] });
  });

  it("[FAM-UI-04][PRD] reads the two through the contract for the given client only, and not the header summary", async () => {
    await loadFamilyInfoData(CLIENT_ID);

    expect(mocks.getClientInfoSections).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
    expect(mocks.getClientDocuments).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
    expect(mocks.getClientHeaderSummary).not.toHaveBeenCalled();
  });

  it.each([
    ["getClientInfoSections", () => mocks.getClientInfoSections.mockRejectedValue(new Error("x"))],
    ["getClientDocuments", () => mocks.getClientDocuments.mockRejectedValue(new Error("x"))],
  ])("[FAM-UI-04][PRD] rejects as a whole when %s rejects", async (_name, rejectIt) => {
    rejectIt();

    await expect(loadFamilyInfoData(CLIENT_ID)).rejects.toThrow("x");
  });
});
