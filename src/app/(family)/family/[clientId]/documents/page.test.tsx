import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientDocument } from "@/types/domain";

const mocks = vi.hoisted(() => ({ getAllClientDocuments: vi.fn() }));
vi.mock("@/server/documents/queries", () => ({ getAllClientDocuments: mocks.getAllClientDocuments }));
vi.mock("@/server/documents/actions", () => ({ getDocumentUrl: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import FamilyDocumentsPage from "./page";

const DOC: ClientDocument = {
  id: "d1",
  clientId: "client-margaret",
  name: "Care plan.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024,
  uploadedAt: "2026-10-02T09:30:00+11:00",
};

beforeEach(() => mocks.getAllClientDocuments.mockReset());

describe("[F0-25][AC-13][AC-14] Family documents page", () => {
  it("[F0-25][AC-13] renders the client's documents and no upload control", async () => {
    mocks.getAllClientDocuments.mockResolvedValue([DOC]);
    render(await FamilyDocumentsPage({ params: Promise.resolve({ clientId: "client-margaret" }) }));

    expect(mocks.getAllClientDocuments).toHaveBeenCalledWith("client-margaret");
    expect(screen.getByRole("button", { name: "Open Care plan.pdf" })).toBeInTheDocument();
    expect(screen.queryByText(/add file/i)).not.toBeInTheDocument();
  });

  it("[F0-25][AC-14] a rejected read shows the error state and logs only the error class", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getAllClientDocuments.mockRejectedValue(new Error("Margaret Thompson secret"));
    render(await FamilyDocumentsPage({ params: Promise.resolve({ clientId: "client-margaret" }) }));

    expect(screen.getByRole("button", { name: /try again|retry/i })).toBeInTheDocument();
    expect(JSON.stringify(log.mock.calls)).not.toContain("Margaret");
    log.mockRestore();
  });
});
