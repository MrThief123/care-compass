import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EventDocument } from "@/types/domain";

import { EventDocuments } from "./event-documents";

/*
 * FAM-08: the Documents section of the Edit/Add event form. Mocks `uploadDocument` and
 * `getDocumentUrl` (src/server/documents/actions) directly, the same way FAM-09's
 * `family-info-wired.test.tsx` tests `DocumentationCard` — the round trip against the real
 * contract (AC-01) is covered separately by `tests/e2e/family-event-documents.spec.ts`.
 */
const mocks = vi.hoisted(() => ({ uploadDocument: vi.fn(), getDocumentUrl: vi.fn() }));

vi.mock("@/server/documents/actions", () => ({
  uploadDocument: mocks.uploadDocument,
  getDocumentUrl: mocks.getDocumentUrl,
}));

afterEach(() => {
  vi.resetAllMocks();
});

const CLIENT_ID = "client-margaret";
const EVENT_ID = "event-margaret-physio";

const EXISTING: EventDocument = {
  id: "doc-physio-referral",
  clientId: CLIENT_ID,
  eventId: EVENT_ID,
  name: "Physio referral.pdf",
  mimeType: "application/pdf",
  sizeBytes: 121_880,
  uploadedAt: "2026-09-02T14:20:00+10:00",
  uploadedBy: "Helen Doyle",
};

function pdf(name: string) {
  return new File(["%PDF-1.4"], name, { type: "application/pdf" });
}

describe("[FAM-08] EventDocuments", () => {
  it("[FAM-08][AC-01] T-01 choosing a file posts it with the client and event ids, and a tile with its name appears", async () => {
    mocks.uploadDocument.mockResolvedValue({
      ok: true,
      data: { documentId: "doc-new", storagePath: `clients/${CLIENT_ID}/doc-new` },
    });
    const user = userEvent.setup();
    render(<EventDocuments clientId={CLIENT_ID} eventId={EVENT_ID} documents={[]} />);

    await user.upload(screen.getByLabelText("Choose a file to add"), pdf("Care summary.pdf"));

    expect(mocks.uploadDocument).toHaveBeenCalledTimes(1);
    const form = mocks.uploadDocument.mock.calls[0]?.[0] as FormData;
    expect(form.get("clientId")).toBe(CLIENT_ID);
    expect(form.get("eventId")).toBe(EVENT_ID);
    expect((form.get("file") as File).name).toBe("Care summary.pdf");
    expect(await screen.findByText("Care summary.pdf")).toBeInTheDocument();
  });

  it("[FAM-08][AC-02] T-02 a refused upload (disallowed type) shows the contract's message and adds no tile", async () => {
    // Named and accepted as a .pdf (so the file picker's own `accept` filter lets it through,
    // same as a real browser); the contract's own signature check is what actually refuses a
    // renamed file (validate-document.test.ts covers that logic directly), mocked here.
    mocks.uploadDocument.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "That file doesn't look like the type it claims to be.",
      },
    });
    const user = userEvent.setup();
    render(<EventDocuments clientId={CLIENT_ID} eventId={EVENT_ID} documents={[]} />);

    const badFile = new File(["#!/bin/sh"], "disguised.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Choose a file to add"), badFile);

    expect(
      await screen.findByText("That file doesn't look like the type it claims to be."),
    ).toBeInTheDocument();
    expect(screen.queryByText("disguised.pdf")).not.toBeInTheDocument();
  });

  it("[FAM-08][AC-03] T-03 an existing tile opens its signed URL in a new tab", async () => {
    mocks.getDocumentUrl.mockResolvedValue({
      ok: true,
      data: { url: "https://files.example.test/signed/physio-referral", expiresInSeconds: 60 },
    });
    const tab = { opener: {} as unknown, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    const user = userEvent.setup();
    render(<EventDocuments clientId={CLIENT_ID} eventId={EVENT_ID} documents={[EXISTING]} />);

    await user.click(screen.getByRole("button", { name: "Physio referral.pdf" }));

    expect(mocks.getDocumentUrl).toHaveBeenCalledWith("doc-physio-referral");
    expect(await vi.waitFor(() => tab.location.href)).toBe(
      "https://files.example.test/signed/physio-referral",
    );
  });

  it("[FAM-08][AC-03] a failed open shows its message instead of opening a tab", async () => {
    mocks.getDocumentUrl.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "Couldn't find that document." },
    });
    const tab = { opener: {} as unknown, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    const user = userEvent.setup();
    render(<EventDocuments clientId={CLIENT_ID} eventId={EVENT_ID} documents={[EXISTING]} />);

    await user.click(screen.getByRole("button", { name: "Physio referral.pdf" }));

    expect(await screen.findByText("Couldn't find that document.")).toBeInTheDocument();
    expect(tab.close).toHaveBeenCalled();
  });

  describe("[FAM-08][FD-01] Add event (no eventId yet)", () => {
    it("explains that a file can be added once the event is saved, rather than opening the picker", async () => {
      const user = userEvent.setup();
      render(<EventDocuments clientId={CLIENT_ID} documents={[]} />);

      await user.click(screen.getByRole("button", { name: "Add file" }));

      expect(
        await screen.findByText("Save the event first, then open it again to add files."),
      ).toBeInTheDocument();
      expect(mocks.uploadDocument).not.toHaveBeenCalled();
    });
  });

  it("[FAM-08][PRD] has no axe violations with an existing tile, the add tile and an error shown", async () => {
    mocks.getDocumentUrl.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "Couldn't find that document." },
    });
    vi.spyOn(window, "open").mockReturnValue({
      opener: {} as unknown,
      location: { href: "" },
      close: vi.fn(),
    } as unknown as Window);
    const user = userEvent.setup();
    const { container } = render(
      <EventDocuments clientId={CLIENT_ID} eventId={EVENT_ID} documents={[EXISTING]} />,
    );
    await user.click(within(container).getByRole("button", { name: "Physio referral.pdf" }));
    await screen.findByText("Couldn't find that document.");

    expect(await axe(container)).toHaveNoViolations();
  });
});
