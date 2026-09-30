import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FamilyInfoPage from "@/app/(family)/family/[clientId]/info/page";
import type { ClientInfoSection, DocumentRef } from "@/types/domain";

/*
 * FAM-09 — Family · Client info, wired. The screen reads and writes only through the
 * `src/server/**` contract CAR-04 merged, so these tests replace it:
 * `saveClientInfoSection` (clients/actions), `uploadDocument` and `getDocumentUrl`
 * (documents/actions). The database side is in supabase/tests/family_client_info.test.sql; the
 * whole path is in tests/e2e/family-client-info.spec.ts. The FAM-UI-04 tests in
 * family-info.test.tsx cover look, focus and states on fixtures.
 */
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getClientInfoSections: vi.fn(),
  getClientDocuments: vi.fn(),
  saveClientInfoSection: vi.fn(),
  uploadDocument: vi.fn(),
  getDocumentUrl: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
}));
vi.mock("@/server/clients/queries", () => ({
  getClientInfoSections: mocks.getClientInfoSections,
}));
vi.mock("@/server/clients/actions", () => ({
  saveClientInfoSection: mocks.saveClientInfoSection,
}));
vi.mock("@/server/documents/queries", () => ({ getClientDocuments: mocks.getClientDocuments }));
vi.mock("@/server/documents/actions", () => ({
  uploadDocument: mocks.uploadDocument,
  getDocumentUrl: mocks.getDocumentUrl,
}));

const CLIENT_ID = "client-margaret";
const TOO_LONG = "Keep it to 5,000 characters or fewer.";

function section(
  kind: ClientInfoSection["kind"],
  title: string,
  content: string,
): ClientInfoSection {
  return {
    id: `info-${kind}`,
    clientId: CLIENT_ID,
    kind,
    title,
    content,
    updatedAt: "2026-09-01T10:00:00+10:00",
  };
}

const SECTIONS = [
  section("description", "Description", "Lives independently."),
  section("habits", "Habits", "Tea at 7am."),
  section("medicalHistory", "Medical history", "Type 2 diabetes."),
];

const DOCUMENTS: DocumentRef[] = [
  {
    id: "doc-care-plan",
    clientId: CLIENT_ID,
    name: "Care plan.pdf",
    url: "",
    uploadedAt: "2026-08-01T09:00:00+10:00",
  },
];

beforeEach(() => {
  mocks.getClientInfoSections.mockResolvedValue(SECTIONS);
  mocks.getClientDocuments.mockResolvedValue(DOCUMENTS);
  mocks.saveClientInfoSection.mockResolvedValue({ ok: true, data: undefined });
  mocks.uploadDocument.mockResolvedValue({
    ok: true,
    data: { documentId: "doc-new", storagePath: `clients/${CLIENT_ID}/doc-new` },
  });
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

async function renderInfo() {
  const page = await FamilyInfoPage({ params: Promise.resolve({ clientId: CLIENT_ID }) });
  return render(page);
}

function card(name: string) {
  return screen.getByRole("region", { name });
}

describe("[FAM-09] order", () => {
  it("[FAM-09][AC-02] T-02 shows Description, Habits, Medical history and Documentation, in that order", async () => {
    await renderInfo();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Description", "Habits", "Medical history", "Documentation"]);
  });
});

describe("[FAM-09] saving a section", () => {
  it("[FAM-09][AC-01] T-01b Save sends the client, the section and the text to the contract, shows the new text, refreshes the route, and focus returns to Edit", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.clear(within(habits).getByRole("textbox"));
    await user.type(within(habits).getByRole("textbox"), "Tea at 6am, then a walk.");
    await user.click(within(habits).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mocks.saveClientInfoSection).toHaveBeenCalledWith(
        CLIENT_ID,
        "habits",
        "Tea at 6am, then a walk.",
      ),
    );
    expect(await within(habits).findByText("Tea at 6am, then a walk.")).toBeInTheDocument();
    expect(within(habits).queryByRole("textbox")).not.toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalled();
    expect(within(habits).getByRole("button", { name: "Edit Habits" })).toHaveFocus();
  });

  it("[FAM-09][AC-01] Medical history is saved under its own kind, and Cancel saves nothing", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const medical = card("Medical history");

    await user.click(within(medical).getByRole("button", { name: "Edit Medical history" }));
    await user.type(within(medical).getByRole("textbox"), " Allergic to penicillin.");
    await user.click(within(medical).getByRole("button", { name: "Cancel" }));
    expect(mocks.saveClientInfoSection).not.toHaveBeenCalled();
    expect(within(medical).getByText("Type 2 diabetes.")).toBeInTheDocument();

    await user.click(within(medical).getByRole("button", { name: "Edit Medical history" }));
    await user.type(within(medical).getByRole("textbox"), " Allergic to penicillin.");
    await user.click(within(medical).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mocks.saveClientInfoSection).toHaveBeenCalledWith(
        CLIENT_ID,
        "medicalHistory",
        "Type 2 diabetes. Allergic to penicillin.",
      ),
    );
  });

  it("[FAM-09][AC-03] T-03 when the contract says the text is too long, the message shows under the box, the draft stays and the old text is not replaced", async () => {
    mocks.saveClientInfoSection.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION", message: TOO_LONG },
    });
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.clear(within(habits).getByRole("textbox"));
    await user.type(within(habits).getByRole("textbox"), "A very long habit");
    await user.click(within(habits).getByRole("button", { name: "Save" }));

    expect(await within(habits).findByText(TOO_LONG)).toBeInTheDocument();
    expect(within(habits).getByRole("textbox")).toHaveValue("A very long habit");
    expect(mocks.refresh).not.toHaveBeenCalled();

    await user.click(within(habits).getByRole("button", { name: "Cancel" }));
    expect(within(habits).getByText("Tea at 7am.")).toBeInTheDocument();
  });

  it("[FAM-09][AC-07] a failed save, including one that throws, shows a message and keeps the draft", async () => {
    mocks.saveClientInfoSection
      .mockResolvedValueOnce({
        ok: false,
        error: { code: "UNEXPECTED", message: "Couldn't save your changes. Try again." },
      })
      .mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.clear(within(habits).getByRole("textbox"));
    await user.type(within(habits).getByRole("textbox"), "Draft kept");
    await user.click(within(habits).getByRole("button", { name: "Save" }));
    expect(
      await within(habits).findByText("Couldn't save your changes. Try again."),
    ).toBeInTheDocument();
    expect(within(habits).getByRole("textbox")).toHaveValue("Draft kept");

    await user.click(within(habits).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.saveClientInfoSection).toHaveBeenCalledTimes(2));
    expect(
      await within(habits).findByText("Couldn't save your changes. Try again."),
    ).toBeInTheDocument();
    expect(within(habits).getByRole("textbox")).toHaveValue("Draft kept");
  });
});

describe("[FAM-09] a section that was never written", () => {
  it("[FAM-09][AC-08] T-07 shows 'Nothing added yet.' with Edit, and family still gets all three text cards", async () => {
    mocks.getClientInfoSections.mockResolvedValue([section("description", "Description", "Hi.")]);
    await renderInfo();

    for (const title of ["Habits", "Medical history"]) {
      expect(within(card(title)).getByText("Nothing added yet.")).toBeInTheDocument();
      expect(within(card(title)).getByRole("button", { name: `Edit ${title}` })).toBeVisible();
    }
  });

  it("[FAM-09][AC-08] a first entry on an unwritten section is saved under its kind", async () => {
    mocks.getClientInfoSections.mockResolvedValue([]);
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.type(within(habits).getByRole("textbox"), "Enjoys the radio.");
    await user.click(within(habits).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mocks.saveClientInfoSection).toHaveBeenCalledWith(
        CLIENT_ID,
        "habits",
        "Enjoys the radio.",
      ),
    );
  });
});

describe("[FAM-09] documents", () => {
  function pdf(name: string) {
    return new File(["%PDF-1.4"], name, { type: "application/pdf" });
  }

  it("[FAM-09][AC-05] T-05b choosing a file posts it with the client and no event, and a tile with its name appears", async () => {
    const user = userEvent.setup();
    await renderInfo();

    await user.upload(screen.getByLabelText("Choose a file to add"), pdf("Referral.pdf"));

    await waitFor(() => expect(mocks.uploadDocument).toHaveBeenCalledTimes(1));
    const form = mocks.uploadDocument.mock.calls[0]?.[0] as FormData;
    expect(form.get("clientId")).toBe(CLIENT_ID);
    expect(form.get("eventId")).toBeNull();
    expect((form.get("file") as File).name).toBe("Referral.pdf");
    expect(await within(card("Documentation")).findByText("Referral.pdf")).toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("[FAM-09][AC-06] T-06 a refused upload shows the contract's message and adds no tile", async () => {
    mocks.uploadDocument.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION", message: "Files must be 20MB or smaller." },
    });
    const user = userEvent.setup();
    await renderInfo();

    await user.upload(screen.getByLabelText("Choose a file to add"), pdf("Huge.pdf"));

    expect(
      await within(card("Documentation")).findByText("Files must be 20MB or smaller."),
    ).toBeInTheDocument();
    expect(within(card("Documentation")).queryByText("Huge.pdf")).not.toBeInTheDocument();
  });

  it("[FAM-09][AC-05] a saved document's tile opens its signed URL in a new tab", async () => {
    mocks.getDocumentUrl.mockResolvedValue({
      ok: true,
      data: { url: "https://files.example.test/signed/care-plan" },
    });
    const tab = { opener: {} as unknown, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    const user = userEvent.setup();
    await renderInfo();

    await user.click(within(card("Documentation")).getByRole("button", { name: "Care plan.pdf" }));

    await waitFor(() => expect(mocks.getDocumentUrl).toHaveBeenCalledWith("doc-care-plan"));
    await waitFor(() =>
      expect(tab.location.href).toBe("https://files.example.test/signed/care-plan"),
    );
  });
});

describe("[FAM-09] accessibility", () => {
  it("[FAM-09][PRD] the wired screen, while editing and showing an error, has no axe violations", async () => {
    mocks.saveClientInfoSection.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION", message: TOO_LONG },
    });
    const user = userEvent.setup();
    const { container } = await renderInfo();
    const habits = card("Habits");
    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.click(within(habits).getByRole("button", { name: "Save" }));
    await within(habits).findByText(TOO_LONG);

    expect(await axe(container)).toHaveNoViolations();
  });
});
