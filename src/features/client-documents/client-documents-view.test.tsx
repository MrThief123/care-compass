import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientDocument } from "@/types/domain";

import { ClientDocumentsView } from "./client-documents-view";

const mocks = vi.hoisted(() => ({ getDocumentUrl: vi.fn() }));
vi.mock("@/server/documents/actions", () => ({ getDocumentUrl: mocks.getDocumentUrl }));

const CLIENT = "client-margaret";
const DOCS: ClientDocument[] = [
  {
    id: "d1",
    clientId: CLIENT,
    name: "Care plan.pdf",
    mimeType: "application/pdf",
    sizeBytes: 300 * 1024,
    uploadedAt: "2026-10-02T09:30:00+11:00",
    uploadedBy: "Helen Doyle",
  },
  {
    id: "d2",
    clientId: CLIENT,
    eventId: "e1",
    eventTitle: "Physiotherapy",
    name: "Exercise plan.pdf",
    mimeType: "application/pdf",
    sizeBytes: 100 * 1024,
    uploadedAt: "2026-10-04T10:00:00+11:00",
  },
  {
    id: "d3",
    clientId: CLIENT,
    name: "Wound photo.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 2 * 1024 * 1024,
    uploadedAt: "2026-09-01T10:00:00+10:00",
    uploadedBy: "Aisha Rahman",
  },
];

/** Names of the body rows, in order. */
function rowNames(): string[] {
  const table = screen.getByRole("table");
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]!.textContent ?? "");
}

beforeEach(() => mocks.getDocumentUrl.mockReset());

describe("[F0-25][AC-04] rows", () => {
  it("[F0-25][AC-04] shows name, type, size, date added in Melbourne time, who added it and the event", () => {
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);

    const row = screen.getByRole("row", { name: /Care plan\.pdf/ });
    expect(within(row).getByText("PDF")).toBeInTheDocument();
    expect(within(row).getByText("300.0 KB")).toBeInTheDocument();
    expect(within(row).getByText("2 Oct 2026")).toBeInTheDocument();
    expect(within(row).getByText("Helen Doyle")).toBeInTheDocument();

    const eventRow = screen.getByRole("row", { name: /Exercise plan\.pdf/ });
    expect(within(eventRow).getByText("Physiotherapy")).toBeInTheDocument();
  });

  it("[F0-25][AC-06] defaults to date added, newest first", () => {
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);
    expect(rowNames()).toEqual(["Exercise plan.pdf", "Care plan.pdf", "Wound photo.jpg"]);
    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveValue("date-desc");
  });
});

describe("[F0-25][AC-06] sorting", () => {
  it("[F0-25][AC-06] sorts by name, size and date added in either direction", async () => {
    const user = userEvent.setup();
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);
    const sort = screen.getByRole("combobox", { name: "Sort by" });

    await user.selectOptions(sort, "name-asc");
    expect(rowNames()).toEqual(["Care plan.pdf", "Exercise plan.pdf", "Wound photo.jpg"]);
    await user.selectOptions(sort, "name-desc");
    expect(rowNames()).toEqual(["Wound photo.jpg", "Exercise plan.pdf", "Care plan.pdf"]);
    await user.selectOptions(sort, "size-desc");
    expect(rowNames()).toEqual(["Wound photo.jpg", "Care plan.pdf", "Exercise plan.pdf"]);
    await user.selectOptions(sort, "size-asc");
    expect(rowNames()).toEqual(["Exercise plan.pdf", "Care plan.pdf", "Wound photo.jpg"]);
    await user.selectOptions(sort, "date-asc");
    expect(rowNames()).toEqual(["Wound photo.jpg", "Care plan.pdf", "Exercise plan.pdf"]);
  });
});

describe("[F0-25][AC-05][AC-07] search", () => {
  it("[F0-25][AC-05] filters by name or event title and announces the count", async () => {
    const user = userEvent.setup();
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);
    expect(screen.getByRole("status")).toHaveTextContent("3 documents");

    await user.type(screen.getByRole("searchbox", { name: "Search documents" }), "physio");
    expect(rowNames()).toEqual(["Exercise plan.pdf"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3 documents");

    await user.clear(screen.getByRole("searchbox", { name: "Search documents" }));
    await user.type(screen.getByRole("searchbox", { name: "Search documents" }), "PLAN");
    expect(rowNames()).toHaveLength(2);
  });

  it("[F0-25][AC-07] shows a no-match state with Clear search, and Download all stays", async () => {
    const user = userEvent.setup();
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);

    await user.type(screen.getByRole("searchbox", { name: "Search documents" }), "zzz");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("No documents match your search")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download all/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(rowNames()).toHaveLength(3);
    expect(screen.getByRole("searchbox", { name: "Search documents" })).toHaveValue("");
  });
});

describe("[F0-25][AC-08] Download all", () => {
  it("[F0-25][AC-08] is a link to the zip route showing the total, unaffected by the search", async () => {
    const user = userEvent.setup();
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);

    const link = screen.getByRole("link", { name: "Download all (3)" });
    expect(link).toHaveAttribute("href", `/api/clients/${CLIENT}/documents/download-all`);

    await user.type(screen.getByRole("searchbox", { name: "Search documents" }), "physio");
    expect(screen.getByRole("link", { name: "Download all (3)" })).toBeInTheDocument();
  });
});

describe("[F0-25][AC-12] opening a document", () => {
  function stubWindowOpen() {
    const tab = { location: { href: "" }, close: vi.fn(), opener: {} };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    return tab;
  }

  it("[F0-25][AC-12] opens the signed URL in a new tab", async () => {
    const tab = stubWindowOpen();
    mocks.getDocumentUrl.mockResolvedValue({
      ok: true,
      data: { url: "https://signed.example/x", expiresInSeconds: 60 },
    });
    const user = userEvent.setup();
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);

    await user.click(screen.getByRole("button", { name: "Open Care plan.pdf" }));

    expect(mocks.getDocumentUrl).toHaveBeenCalledWith("d1");
    expect(tab.location.href).toBe("https://signed.example/x");
  });

  it("[F0-25][AC-12] shows the failure message and closes the blank tab", async () => {
    const tab = stubWindowOpen();
    mocks.getDocumentUrl.mockResolvedValue({
      ok: false,
      error: { code: "NOT_AVAILABLE", message: "Documents are not available yet." },
    });
    const user = userEvent.setup();
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);

    await user.click(screen.getByRole("button", { name: "Open Care plan.pdf" }));

    expect(await screen.findByText("Documents are not available yet.")).toBeInTheDocument();
    expect(tab.close).toHaveBeenCalled();
  });
});

describe("[F0-25][AC-13][AC-14][AC-15] states and accessibility", () => {
  it("[F0-25][AC-14] with no documents shows an empty state, with no search, sort or Download all", () => {
    render(<ClientDocumentsView clientId={CLIENT} documents={[]} />);
    expect(screen.getByText("No documents yet")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Download all/ })).not.toBeInTheDocument();
  });

  it("[F0-25][AC-13] has no upload control", () => {
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);
    expect(screen.queryByText(/add file/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("[F0-25][AC-15] has no axe violations, including a very long file name", async () => {
    const long = {
      ...DOCS[0]!,
      id: "d4",
      name: `${"Ophthalmologist letter about post-operative eye drop schedule ".repeat(3)}.pdf`,
    };
    const { container } = render(
      <ClientDocumentsView clientId={CLIENT} documents={[...DOCS, long]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
