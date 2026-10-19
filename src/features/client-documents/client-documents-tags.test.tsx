import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientDocument } from "@/types/domain";

import { ClientDocumentsView } from "./client-documents-view";

/*
 * [F0-29] Tags on the Documents page (AC-10–AC-13, AC-15, AC-16): a Tags column, a Tag filter
 * with the search, and for Family an Edit tags dialog. `setDocumentTags` is mocked.
 */
const mocks = vi.hoisted(() => ({
  getDocumentUrl: vi.fn(),
  setDocumentTags: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/server/documents/actions", () => ({ getDocumentUrl: mocks.getDocumentUrl }));
vi.mock("@/server/tags/actions", () => ({ setDocumentTags: mocks.setDocumentTags }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));

const CLIENT = "client-margaret";
const DOCS: ClientDocument[] = [
  {
    id: "d1",
    clientId: CLIENT,
    name: "Care plan.pdf",
    mimeType: "application/pdf",
    sizeBytes: 300 * 1024,
    uploadedAt: "2026-10-02T09:30:00+11:00",
  },
  {
    id: "d2",
    clientId: CLIENT,
    name: "GP referral.pdf",
    mimeType: "application/pdf",
    sizeBytes: 100 * 1024,
    uploadedAt: "2026-10-04T10:00:00+11:00",
  },
  {
    id: "d3",
    clientId: CLIENT,
    name: "Physio exercises.pdf",
    mimeType: "application/pdf",
    sizeBytes: 100 * 1024,
    uploadedAt: "2026-10-05T10:00:00+11:00",
  },
];
const TAGS = { d2: ["Doctors"], d3: ["Doctors", "Therapy"] };

function rowFor(name: string): HTMLElement {
  return screen.getByRole("button", { name: `Open ${name}` }).closest("tr")!;
}

function rowNames(): string[] {
  return within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]!.textContent ?? "");
}

beforeEach(() => {
  mocks.setDocumentTags.mockReset();
  mocks.refresh.mockReset();
});

describe("[F0-29] Documents tags and filter", () => {
  it("[F0-29][AC-10] shows each document's tags, or a dash", () => {
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} tagsById={TAGS} />);
    expect(screen.getByRole("columnheader", { name: "Tags" })).toBeInTheDocument();
    expect(
      within(rowFor("Physio exercises.pdf")).getByRole("list", { name: "Tags" }),
    ).toHaveTextContent("DoctorsTherapy");
    expect(within(rowFor("Care plan.pdf")).queryByRole("list", { name: "Tags" })).toBeNull();
  });

  it("[F0-29][AC-10] the Tag filter lists tags in use and narrows the list with the search", async () => {
    const user = userEvent.setup();
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} tagsById={TAGS} />);
    const select = screen.getByLabelText("Tag");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All tags", "Doctors", "Therapy"]);
    await user.selectOptions(select, "Doctors");
    expect(rowNames().sort()).toEqual(["GP referral.pdf", "Physio exercises.pdf"]);
    expect(screen.getByText("2 of 3 documents")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search documents"), "physio");
    expect(rowNames()).toEqual(["Physio exercises.pdf"]);
  });

  it("[F0-29][AC-11] Family: Edit tags, choose one, Save saves and refreshes", async () => {
    const user = userEvent.setup();
    mocks.setDocumentTags.mockResolvedValue({ ok: true, data: undefined });
    render(
      <ClientDocumentsView
        clientId={CLIENT}
        documents={DOCS}
        tagsById={TAGS}
        tagOptions={["Doctors", "Therapy"]}
        canEditTags
      />,
    );
    await user.click(screen.getByRole("button", { name: "Edit tags for Care plan.pdf" }));
    const dialog = screen.getByRole("dialog", { name: "Tags for Care plan.pdf" });
    await user.click(within(dialog).getByRole("button", { name: "Doctors" }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(mocks.setDocumentTags).toHaveBeenCalledWith(CLIENT, "d1", ["Doctors"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(rowFor("Care plan.pdf")).getByRole("list", { name: "Tags" })).toHaveTextContent(
      "Doctors",
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("[F0-29][AC-11] Cancel changes nothing", async () => {
    const user = userEvent.setup();
    render(
      <ClientDocumentsView
        clientId={CLIENT}
        documents={DOCS}
        tagsById={TAGS}
        tagOptions={["Doctors", "Therapy"]}
        canEditTags
      />,
    );
    await user.click(screen.getByRole("button", { name: "Edit tags for GP referral.pdf" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Doctors" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(mocks.setDocumentTags).not.toHaveBeenCalled();
    expect(within(rowFor("GP referral.pdf")).getByRole("list", { name: "Tags" })).toHaveTextContent(
      "Doctors",
    );
  });

  it("[F0-29][AC-13] a failed save keeps the dialog and the choice, with a message", async () => {
    const user = userEvent.setup();
    mocks.setDocumentTags.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save the tags. Try again." },
    });
    render(
      <ClientDocumentsView
        clientId={CLIENT}
        documents={DOCS}
        tagsById={TAGS}
        tagOptions={["Doctors", "Therapy"]}
        canEditTags
      />,
    );
    await user.click(screen.getByRole("button", { name: "Edit tags for Care plan.pdf" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Therapy" }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Couldn't save the tags. Try again.",
    );
    expect(within(dialog).getByRole("button", { name: "Therapy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("[F0-29][AC-12] a carer sees tags and the filter but no Edit tags", () => {
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} tagsById={TAGS} />);
    expect(screen.getByLabelText("Tag")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit tags/ })).not.toBeInTheDocument();
  });

  it("[F0-29][AC-15] with no tags at all there is no Tags column and no Tag filter", () => {
    render(<ClientDocumentsView clientId={CLIENT} documents={DOCS} />);
    expect(screen.queryByRole("columnheader", { name: "Tags" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tag")).not.toBeInTheDocument();
  });

  it("[F0-29][AC-16] is axe clean, with the dialog open", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ClientDocumentsView
        clientId={CLIENT}
        documents={DOCS}
        tagsById={TAGS}
        tagOptions={["Doctors", "Therapy"]}
        canEditTags
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Edit tags for Care plan.pdf" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
