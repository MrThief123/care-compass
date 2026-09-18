import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ClientInfoSection, DocumentRef } from "@/types/domain";

import { ClientInfoView } from "./client-info-view";

const SECTIONS: ClientInfoSection[] = [
  {
    id: "section-description",
    clientId: "client-margaret",
    kind: "description",
    title: "Description",
    content: "Enjoys gardening and short walks.",
    updatedAt: "2026-10-01T10:00:00+11:00",
  },
];

const DOCUMENTS: DocumentRef[] = [
  {
    id: "doc-1",
    clientId: "client-margaret",
    name: "Care plan 2026.pdf",
    url: "https://example.invalid/doc-1",
    uploadedAt: "2026-10-01T10:00:00+11:00",
  },
];

describe("ClientInfoView", () => {
  it("[UI-03][AC-04] renders no 'Edit' links and no 'Add file' tile when canEdit is false", () => {
    render(
      <ClientInfoView
        clientName="Margaret"
        clientMeta="75 years · Ringwood"
        sections={SECTIONS}
        documents={DOCUMENTS}
        canEdit={false}
      />,
    );

    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add file/i })).not.toBeInTheDocument();
  });

  it("renders 'Edit' controls and an 'Add file' tile when canEdit is true", () => {
    render(
      <ClientInfoView
        clientName="Margaret"
        clientMeta="75 years · Ringwood"
        sections={SECTIONS}
        documents={DOCUMENTS}
        canEdit
        onEditSection={() => {}}
        onAddFile={() => {}}
      />,
    );

    expect(screen.getAllByRole("button", { name: /edit/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /add file/i })).toBeInTheDocument();
  });
});
