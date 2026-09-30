import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import InfoPage from "@/app/(carer)/carer/patients/[clientId]/info/page";
import PatientLayout from "@/app/(carer)/carer/patients/[clientId]/layout";
import type { CarerPatientRow } from "@/server/shifts/queries";
import type { ClientInfoSection, DocumentRef } from "@/types/domain";

/*
 * CAR-04 — Carer · Client info, wired. The screen reads and writes only through the
 * `src/server/**` contract, so these tests replace it: `saveClientInfoSection`
 * (src/server/clients/actions) and `uploadDocument` (src/server/documents/actions) are the
 * contract this feature adds or reuses. The database side is in
 * supabase/tests/carer_client_info.test.sql and tests/integration/carer-client-info.test.ts.
 */
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  pathname: { current: "/carer/patients/client-margaret/info" },
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT ${href}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getCurrentUser: vi.fn(),
  getCarerPatients: vi.fn(),
  getClientInfoSections: vi.fn(),
  getClientDocuments: vi.fn(),
  saveClientInfoSection: vi.fn(),
  uploadDocument: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
  usePathname: () => mocks.pathname.current,
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));
vi.mock("@/server/auth/queries", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/shifts/queries", () => ({ getCarerPatients: mocks.getCarerPatients }));
vi.mock("@/server/clients/queries", () => ({
  getClientInfoSections: mocks.getClientInfoSections,
}));
vi.mock("@/server/clients/actions", () => ({
  saveClientInfoSection: mocks.saveClientInfoSection,
}));
vi.mock("@/server/documents/queries", () => ({ getClientDocuments: mocks.getClientDocuments }));
vi.mock("@/server/documents/actions", () => ({ uploadDocument: mocks.uploadDocument }));

const CARER_ID = "staff-aisha";
const MARGARET = "client-margaret"; // Aisha's shift is in progress
const ROBERT = "client-robert"; // only a future shift

const AISHA = {
  profileId: CARER_ID,
  role: "carer",
  organisationId: "org-banksia",
  firstName: "Aisha",
  lastName: "Rahman",
};

const PATIENTS: CarerPatientRow[] = [
  {
    clientId: MARGARET,
    firstName: "Margaret",
    name: "Margaret Doyle",
    age: 78,
    suburb: "Preston VIC",
    onShift: true,
  },
  {
    clientId: ROBERT,
    firstName: "Robert",
    name: "Robert Hale",
    age: 82,
    suburb: "Reservoir VIC",
    onShift: false,
  },
];

const SAVE_REJECTED = "Your shift has ended, so changes can't be saved.";

function section(
  clientId: string,
  kind: ClientInfoSection["kind"],
  title: string,
  content: string,
): ClientInfoSection {
  return {
    id: `info-${clientId}-${kind}`,
    clientId,
    kind,
    title,
    content,
    updatedAt: "2026-09-01T10:00:00+10:00",
  };
}

function sectionsFor(clientId: string): ClientInfoSection[] {
  return [
    section(clientId, "description", "Description", "Lives alone."),
    section(clientId, "habits", "Habits", "Tea at 7am."),
    section(clientId, "medicalHistory", "Medical history", "Hip replacement 2024."),
  ];
}

const CARE_PLAN: DocumentRef = {
  id: "doc-care-plan",
  clientId: MARGARET,
  name: "Care plan.pdf",
  url: "/files/doc-care-plan",
  uploadedAt: "2026-08-01T09:00:00+10:00",
  uploadedBy: "Helen Doyle",
};

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue(AISHA);
  mocks.getCarerPatients.mockResolvedValue(PATIENTS);
  mocks.getClientInfoSections.mockImplementation(async (id: string) => sectionsFor(id));
  mocks.getClientDocuments.mockResolvedValue([CARE_PLAN]);
  mocks.saveClientInfoSection.mockResolvedValue({ ok: true, data: undefined });
  mocks.uploadDocument.mockResolvedValue({
    ok: true,
    data: { documentId: "doc-new", storagePath: "clients/x/doc-new/Diet sheet.pdf" },
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

function params(clientId: string) {
  return { params: Promise.resolve({ clientId }) };
}

async function renderInfo(clientId: string) {
  return render(await InfoPage(params(clientId)));
}

async function editHabits(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole("button", { name: "Edit Habits" }));
  const box = screen.getByRole("textbox", { name: "Habits" });
  await user.clear(box);
  await user.type(box, text);
  return box;
}

describe("[CAR-04][AC-01] off shift the Info is read-only", () => {
  it("[CAR-04][AC-01] shows the four cards, the 'View only' notice, no Edit and no Add file", async () => {
    await renderInfo(ROBERT);

    for (const title of ["Description", "Habits", "Medical history", "Documentation"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText("Tea at 7am.")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("View only");
    expect(screen.queryByRole("button", { name: /^Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add file" })).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });
});

describe("[CAR-04][AC-02] on shift the carer edits a section", () => {
  it("[CAR-04][AC-02] saves Habits through the contract and shows the new text", async () => {
    const user = userEvent.setup();
    await renderInfo(MARGARET);

    await editHabits(user, "Tea at 6am, then a walk.");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mocks.saveClientInfoSection).toHaveBeenCalledTimes(1);
    expect(mocks.saveClientInfoSection).toHaveBeenCalledWith(
      MARGARET,
      "habits",
      "Tea at 6am, then a walk.",
    );
    expect(await screen.findByText("Tea at 6am, then a walk.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(SAVE_REJECTED)).not.toBeInTheDocument();
  });

  it("[CAR-04][AC-02] Cancel saves nothing and keeps the old text", async () => {
    const user = userEvent.setup();
    await renderInfo(MARGARET);

    await editHabits(user, "Something else");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.saveClientInfoSection).not.toHaveBeenCalled();
    expect(screen.getByText("Tea at 7am.")).toBeInTheDocument();
  });

  it("[CAR-04][AC-02] reads the sections and documents of the patient through the contract", async () => {
    await renderInfo(MARGARET);

    expect(mocks.getClientInfoSections).toHaveBeenCalledWith(MARGARET);
    expect(mocks.getClientDocuments).toHaveBeenCalledWith(MARGARET);
  });
});

describe("[CAR-04][AC-04] a client the carer has no shift with", () => {
  it("[CAR-04][AC-04] the layout redirects to Patients", async () => {
    await expect(
      PatientLayout({ children: <p>tab content</p>, ...params("client-stranger") }),
    ).rejects.toThrow("NEXT_REDIRECT /carer/patients");
    expect(mocks.redirect).toHaveBeenCalledWith("/carer/patients");
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("[CAR-04][AC-04] Info redirects to Patients and reads nothing about the client", async () => {
    await expect(InfoPage(params("client-stranger"))).rejects.toThrow(
      "NEXT_REDIRECT /carer/patients",
    );
    expect(mocks.getClientInfoSections).not.toHaveBeenCalled();
    expect(mocks.getClientDocuments).not.toHaveBeenCalled();
  });
});

describe("[CAR-04][AC-05] the shift ends while editing", () => {
  it("[CAR-04][AC-05] shows the shift-ended message, keeps the draft and the saved text", async () => {
    mocks.saveClientInfoSection.mockResolvedValue({
      ok: false,
      error: { code: "NOT_ALLOWED", message: SAVE_REJECTED },
    });
    const user = userEvent.setup();
    await renderInfo(MARGARET);

    const box = await editHabits(user, "Late change");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(SAVE_REJECTED)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Habits" })).toBe(box);
    expect(box).toHaveValue("Late change");
    expect(screen.queryByText("Tea at 7am.")).not.toBeInTheDocument(); // the box, not the card, holds text
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Tea at 7am.")).toBeInTheDocument();
  });
});

describe("[CAR-04][AC-06] text that is too long", () => {
  it("[CAR-04][AC-06] shows the contract's validation error and does not show the text as saved", async () => {
    mocks.saveClientInfoSection.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION", message: "Keep this under 5,000 characters." },
    });
    const user = userEvent.setup();
    await renderInfo(MARGARET);

    await user.click(screen.getByRole("button", { name: "Edit Habits" }));
    const box = screen.getByRole("textbox", { name: "Habits" });
    await user.clear(box);
    await user.click(box);
    await user.paste("x".repeat(5001));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Keep this under 5,000 characters.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Habits" })).toBeInTheDocument();
  });
});

describe("[CAR-04][AC-07] on shift the carer adds a file", () => {
  function fileInput() {
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("no file input on the Documentation card");
    return input;
  }

  it("[CAR-04][AC-07] uploads the chosen file for the client and shows its tile", async () => {
    const user = userEvent.setup();
    await renderInfo(MARGARET);
    expect(screen.getByRole("button", { name: "Add file" })).toBeInTheDocument();

    await user.upload(
      fileInput(),
      new File(["%PDF-1.4"], "Diet sheet.pdf", { type: "application/pdf" }),
    );

    await waitFor(() => expect(mocks.uploadDocument).toHaveBeenCalledTimes(1));
    const form = mocks.uploadDocument.mock.calls[0]![0] as FormData;
    expect(form.get("clientId")).toBe(MARGARET);
    expect((form.get("file") as File).name).toBe("Diet sheet.pdf");
    expect(form.get("eventId")).toBeNull();
    const card = screen.getByRole("region", { name: "Documentation" });
    expect(await within(card).findByText("Diet sheet.pdf")).toBeInTheDocument();
    expect(within(card).getByText("Care plan.pdf")).toBeInTheDocument();
  });

  it("[CAR-04][AC-07] shows the upload's error and no tile when it is refused", async () => {
    mocks.uploadDocument.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION", message: "That file is too large. The limit is 20 MB." },
    });
    const user = userEvent.setup();
    await renderInfo(MARGARET);

    await user.upload(fileInput(), new File(["big"], "Huge.pdf", { type: "application/pdf" }));

    expect(
      await screen.findByText("That file is too large. The limit is 20 MB."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Huge.pdf")).not.toBeInTheDocument();
  });

  it("[CAR-04][AC-07] offers no way to remove a file", async () => {
    await renderInfo(MARGARET);

    expect(screen.queryByRole("button", { name: /remove|delete|detach/i })).not.toBeInTheDocument();
  });
});

describe("[CAR-04][AC-09] a contract failure", () => {
  it("[CAR-04][AC-09] shows the error state and logs nothing that names a client or carer", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getClientInfoSections.mockRejectedValue(new Error("Margaret Doyle Aisha secret"));

    await renderInfo(MARGARET);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Margaret|Aisha|secret/);
  });
});
