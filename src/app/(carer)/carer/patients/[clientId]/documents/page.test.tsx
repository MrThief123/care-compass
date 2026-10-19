import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientDocument } from "@/types/domain";

const mocks = vi.hoisted(() => ({ getAllClientDocuments: vi.fn(), findCarerPatient: vi.fn() }));
vi.mock("@/server/documents/queries", () => ({
  getAllClientDocuments: mocks.getAllClientDocuments,
}));
vi.mock("@/server/documents/actions", () => ({ getDocumentUrl: vi.fn() }));
vi.mock("@/features/carer-patients/find-patient", () => ({
  findCarerPatient: mocks.findCarerPatient,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import PatientDocumentsPage from "./page";

const DOC: ClientDocument = {
  id: "d1",
  clientId: "client-margaret",
  name: "Care plan.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024,
  uploadedAt: "2026-10-02T09:30:00+11:00",
};

beforeEach(() => {
  mocks.getAllClientDocuments.mockReset().mockResolvedValue([DOC]);
  mocks.findCarerPatient.mockReset();
});

describe("[F0-25][AC-13] Carer patient documents page", () => {
  it("[F0-25][AC-13] shows documents for an assigned patient who is not on shift, with no upload", async () => {
    mocks.findCarerPatient.mockResolvedValue({ clientId: "client-margaret", onShift: false });
    render(
      await PatientDocumentsPage({ params: Promise.resolve({ clientId: "client-margaret" }) }),
    );

    expect(screen.getByRole("button", { name: "Open Care plan.pdf" })).toBeInTheDocument();
    expect(screen.queryByText(/add file/i)).not.toBeInTheDocument();
  });

  it("[F0-25][AC-13] an unassigned patient redirects before any document is read", async () => {
    mocks.findCarerPatient.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(
      PatientDocumentsPage({ params: Promise.resolve({ clientId: "client-other" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.getAllClientDocuments).not.toHaveBeenCalled();
  });
});
