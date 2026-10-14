import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminClientInfoPage from "@/app/(admin)/admin/clients/[clientId]/info/page";
import CarerInfoPage from "@/app/(carer)/carer/patients/[clientId]/info/page";
import FamilyInfoPage from "@/app/(family)/family/[clientId]/info/page";
import type { CarerPatientRow } from "@/server/shifts/queries";
import type { ClientCustomSection, ClientInfoSection } from "@/types/domain";

/*
 * F0-26 — Client Details on Family, Admin and Carer reads the custom sections through the
 * contract and draws them after Medical history, before Documentation, with the controls each
 * role may use. The contract is stubbed; the list itself is in custom-sections.test.tsx.
 */
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT ${href}`);
  }),
  getClientInfoSections: vi.fn(),
  getClientDocuments: vi.fn(),
  getClientCustomSections: vi.fn(),
  assertAdminClientAccess: vi.fn(),
  getCurrentUser: vi.fn(),
  getCarerPatients: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
  usePathname: () => "/",
  redirect: mocks.redirect,
}));
vi.mock("@/server/clients/queries", () => ({
  getClientInfoSections: mocks.getClientInfoSections,
}));
vi.mock("@/server/clients/custom-sections", () => ({
  getClientCustomSections: mocks.getClientCustomSections,
}));
vi.mock("@/server/clients/actions", () => ({ saveClientInfoSection: vi.fn() }));
vi.mock("@/server/clients/custom-section-actions", () => ({
  addClientCustomSection: vi.fn(),
  updateClientCustomSection: vi.fn(),
  removeClientCustomSection: vi.fn(),
}));
vi.mock("@/server/documents/queries", () => ({ getClientDocuments: mocks.getClientDocuments }));
vi.mock("@/server/documents/actions", () => ({
  uploadDocument: vi.fn(),
  getDocumentUrl: vi.fn(),
}));
vi.mock("@/server/admin/client-access", () => ({
  assertAdminClientAccess: mocks.assertAdminClientAccess,
}));
vi.mock("@/server/auth/queries", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/shifts/queries", () => ({ getCarerPatients: mocks.getCarerPatients }));

const MARGARET = "client-margaret"; // the carer's shift is in progress
const ROBERT = "client-robert"; // only a future shift

const BUILT_INS: ClientInfoSection[] = [
  { kind: "description", title: "Description", content: "Lives alone." },
  { kind: "habits", title: "Habits", content: "Tea at 7am." },
  { kind: "medicalHistory", title: "Medical history", content: "Hip replacement." },
].map((s) => ({
  ...s,
  id: `info-${s.kind}`,
  clientId: MARGARET,
  updatedAt: "2026-09-01T10:00:00+10:00",
})) as ClientInfoSection[];

function custom(id: string, title: string, content: string): ClientCustomSection {
  return { id, clientId: MARGARET, title, content, updatedAt: "2026-10-01T10:00:00+11:00" };
}

const CUSTOM = [custom("cs-1", "Communication", "Short sentences."), custom("cs-2", "Sleep", "")];

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

function params(clientId: string) {
  return { params: Promise.resolve({ clientId }) };
}

function headings() {
  return screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
}

beforeEach(() => {
  mocks.getClientInfoSections.mockResolvedValue(BUILT_INS);
  mocks.getClientDocuments.mockResolvedValue([]);
  mocks.getClientCustomSections.mockResolvedValue(CUSTOM);
  mocks.assertAdminClientAccess.mockResolvedValue(undefined);
  mocks.getCurrentUser.mockResolvedValue({ profileId: "staff-aisha", role: "carer" });
  mocks.getCarerPatients.mockResolvedValue(PATIENTS);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("[F0-26][AC-01] Family Client Details", () => {
  it("[F0-26][AC-01] draws custom sections after Medical history and before Documentation, with Add section", async () => {
    render(await FamilyInfoPage(params(MARGARET)));

    expect(mocks.getClientCustomSections).toHaveBeenCalledWith(MARGARET);
    expect(headings()).toEqual([
      "Description",
      "Habits",
      "Medical history",
      "Communication",
      "Sleep",
      "Documentation",
    ]);
    expect(screen.getByRole("button", { name: "Add section" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Communication" })).toBeInTheDocument();
  });

  it("[F0-26][AC-07] the built-in sections offer Edit only: no Remove and no title field", async () => {
    render(await FamilyInfoPage(params(MARGARET)));

    for (const title of ["Description", "Habits", "Medical history"]) {
      expect(screen.getByRole("button", { name: `Edit ${title}` })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: `Remove ${title}` })).not.toBeInTheDocument();
    }
  });

  it("[F0-26][AC-14] a rejected custom-section read shows the error state and logs no client data", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getClientCustomSections.mockRejectedValue(new Error(`no sections for ${MARGARET}`));

    render(await FamilyInfoPage(params(MARGARET)));

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Communication" })).not.toBeInTheDocument();
    expect(JSON.stringify(log.mock.calls)).not.toContain(MARGARET);
  });
});

describe("[F0-26][AC-13] Admin Client Details", () => {
  it("[F0-26][AC-13] shows custom sections with Add section, Edit and Remove section", async () => {
    render(await AdminClientInfoPage(params(MARGARET)));

    expect(headings()).toContain("Communication");
    expect(screen.getByRole("button", { name: "Add section" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Communication" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Communication" })).toBeInTheDocument();
  });

  it("[F0-26][AC-13] reads nothing for a client the admin may not open", async () => {
    mocks.assertAdminClientAccess.mockRejectedValue(new Error("NEXT_REDIRECT /admin"));

    await expect(AdminClientInfoPage(params(MARGARET))).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.getClientCustomSections).not.toHaveBeenCalled();
  });
});

describe("[F0-26][AC-12] Carer Client Details", () => {
  it("[F0-26][AC-12] on shift: custom sections in place, with Add section, Edit and Remove section", async () => {
    render(await CarerInfoPage(params(MARGARET)));

    expect(headings()).toEqual([
      "Description",
      "Habits",
      "Medical history",
      "Communication",
      "Sleep",
      "Documentation",
    ]);
    expect(screen.getByRole("button", { name: "Add section" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Communication" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Communication" })).toBeInTheDocument();
  });

  it("[F0-26][AC-12] off shift: written sections read-only, the empty one hidden, no controls", async () => {
    mocks.getClientCustomSections.mockResolvedValue(
      CUSTOM.map((s) => ({ ...s, clientId: ROBERT })),
    );

    render(await CarerInfoPage(params(ROBERT)));

    expect(screen.getByRole("heading", { name: "Communication" })).toBeInTheDocument();
    expect(screen.getByText("Short sentences.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sleep" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add section" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^(Edit|Remove) Communication$/ }),
    ).not.toBeInTheDocument();
  });

  it("[F0-26][AC-12] reads nothing for a patient who is not the carer's", async () => {
    await expect(CarerInfoPage(params("client-nobody"))).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.getClientCustomSections).not.toHaveBeenCalled();
  });
});
