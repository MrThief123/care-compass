import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientInfoSection, DocumentRef } from "@/types/domain";

import { clientMetaLine, loadFamilyInfoData } from "./info-data";

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

describe("[FAM-UI-04][PRD] clientMetaLine", () => {
  it("[FAM-UI-04][AC-01] reads '78 years · Preston VIC · Banksia Home Care', as the shell header does", () => {
    expect(clientMetaLine(HEADER)).toBe("78 years · Preston VIC · Banksia Home Care");
  });

  it("[FAM-UI-04][PRD] leaves out the suburb or the organisation when the client has none, with no stray separator", () => {
    expect(clientMetaLine({ ...HEADER, suburb: undefined })).toBe("78 years · Banksia Home Care");
    expect(clientMetaLine({ ...HEADER, organisationName: undefined })).toBe(
      "78 years · Preston VIC",
    );
    expect(clientMetaLine({ ...HEADER, suburb: undefined, organisationName: undefined })).toBe(
      "78 years",
    );
    expect(clientMetaLine({ ...HEADER, suburb: "", organisationName: "" })).toBe("78 years");
  });
});

describe("[FAM-UI-04][PRD] loadFamilyInfoData", () => {
  it("[FAM-UI-04][AC-01] gathers the client's name and summary line, sections and documents", async () => {
    const data = await loadFamilyInfoData(CLIENT_ID);

    expect(data).toEqual({
      client: { firstName: "Margaret", meta: "78 years · Preston VIC · Banksia Home Care" },
      sections: [SECTION],
      documents: [DOCUMENT],
    });
  });

  it("[FAM-UI-04][PRD] reads all three through the contract for the given client only", async () => {
    await loadFamilyInfoData(CLIENT_ID);

    expect(mocks.getClientHeaderSummary).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
    expect(mocks.getClientInfoSections).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
    expect(mocks.getClientDocuments).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
  });

  it("[FAM-UI-04][PRD] does not put the client's last name or date of birth into what the screen is given", async () => {
    const data = await loadFamilyInfoData(CLIENT_ID);

    expect(JSON.stringify(data.client)).not.toContain("Doyle");
  });

  it.each([
    [
      "getClientHeaderSummary",
      () => mocks.getClientHeaderSummary.mockRejectedValue(new Error("x")),
    ],
    ["getClientInfoSections", () => mocks.getClientInfoSections.mockRejectedValue(new Error("x"))],
    ["getClientDocuments", () => mocks.getClientDocuments.mockRejectedValue(new Error("x"))],
  ])("[FAM-UI-04][PRD] rejects as a whole when %s rejects", async (_name, rejectIt) => {
    rejectIt();

    await expect(loadFamilyInfoData(CLIENT_ID)).rejects.toThrow("x");
  });
});
