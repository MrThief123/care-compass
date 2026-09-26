import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CalendarTabPage from "@/app/(carer)/carer/patients/[clientId]/calendar/page";
import HomeTabPage from "@/app/(carer)/carer/patients/[clientId]/home/page";
import InfoLoading from "@/app/(carer)/carer/patients/[clientId]/info/loading";
import InfoPage from "@/app/(carer)/carer/patients/[clientId]/info/page";
import PatientLayout from "@/app/(carer)/carer/patients/[clientId]/layout";
import PatientPage from "@/app/(carer)/carer/patients/[clientId]/page";
import CareLogTabPage from "@/app/(carer)/carer/patients/[clientId]/tasks/page";
import PatientsLoading from "@/app/(carer)/carer/patients/loading";
import PatientsPage from "@/app/(carer)/carer/patients/page";
import type { CarerPatientRow } from "@/server/shifts/queries";
import type { ClientInfoSection, DocumentRef } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  pathname: { current: "/carer/patients" },
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
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
  usePathname: () => mocks.pathname.current,
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));
vi.mock("@/server/auth/queries", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/server/shifts/queries", () => ({
  getCarerPatients: mocks.getCarerPatients,
}));
vi.mock("@/server/clients/queries", () => ({
  getClientInfoSections: mocks.getClientInfoSections,
}));
vi.mock("@/server/documents/queries", () => ({
  getClientDocuments: mocks.getClientDocuments,
}));

/*
 * The screens read only through the `src/server/**` contract, so these tests
 * replace it with rows shaped like docs/design/screens/carer-02-patients.png.
 * Aisha is on shift with Margaret and has only future shifts with the rest
 * (ACCEPTANCE_CRITERIA.md). `getCarerPatients` itself is tested against the
 * fixtures in src/server/shifts/queries.test.ts.
 */
const CARER_ID = "staff-aisha";

const AISHA = {
  profileId: CARER_ID,
  role: "carer",
  organisationId: "org-banksia",
  firstName: "Aisha",
  lastName: "Rahman",
};

function patient(firstName: string, age: number, suburb: string, onShift = false): CarerPatientRow {
  return { clientId: `client-${firstName.toLowerCase()}`, firstName, age, suburb, onShift };
}

const PATIENTS: CarerPatientRow[] = [
  patient("Margaret", 78, "Preston VIC", true),
  patient("Robert", 82, "Reservoir VIC"),
  patient("Elsie", 90, "Thornbury VIC"),
  patient("Frank", 76, "Northcote VIC"),
  patient("Doris", 85, "Preston VIC"),
  patient("Harold", 79, "Coburg VIC"),
  patient("Jean", 88, "Fairfield VIC"),
];

const MARGARET = "client-margaret";
const ROBERT = "client-robert";

function section(clientId: string, kind: ClientInfoSection["kind"], title: string): ClientInfoSection {
  return {
    id: `info-${clientId}-${kind}`,
    clientId,
    kind,
    title,
    content: `${title} text.`,
    updatedAt: "2026-09-01T10:00:00+10:00",
  };
}

function sectionsFor(clientId: string): ClientInfoSection[] {
  return [
    section(clientId, "description", "Description"),
    section(clientId, "habits", "Habits"),
    section(clientId, "medicalHistory", "Medical history"),
  ];
}

function documentsFor(clientId: string): DocumentRef[] {
  return [
    {
      id: `doc-${clientId}`,
      clientId,
      name: "Care plan.pdf",
      url: `/files/doc-${clientId}`,
      uploadedAt: "2026-08-01T09:00:00+10:00",
      uploadedBy: "Helen Doyle",
    },
  ];
}

beforeEach(() => {
  mocks.pathname.current = "/carer/patients";
  mocks.getCurrentUser.mockResolvedValue(AISHA);
  mocks.getCarerPatients.mockResolvedValue(PATIENTS);
  mocks.getClientInfoSections.mockImplementation(async (id: string) => sectionsFor(id));
  mocks.getClientDocuments.mockImplementation(async (id: string) => documentsFor(id));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

/** The pages log a tagged line when the contract rejects; keep it out of the test output. */
function captureErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

async function renderPatients() {
  return render(await PatientsPage());
}

function params(clientId: string) {
  return { params: Promise.resolve({ clientId }) };
}

async function renderInfo(clientId: string) {
  mocks.pathname.current = `/carer/patients/${clientId}/info`;
  return render(await InfoPage(params(clientId)));
}

async function renderLayout(clientId: string, tab = "info") {
  mocks.pathname.current = `/carer/patients/${clientId}/${tab}`;
  const layout = await PatientLayout({
    children: <p>tab content</p>,
    ...params(clientId),
  });
  return render(layout);
}

function cardLinks() {
  return screen.queryAllByRole("link").filter((link) =>
    link.getAttribute("href")?.startsWith("/carer/patients/"),
  );
}

describe("[CAR-UI-02] Carer Patients grid", () => {
  it("[CAR-UI-02][AC-01] shows 7 cards in the design's order, with Margaret '78 years · Preston VIC' and Jean '88 years · Fairfield VIC'", async () => {
    await renderPatients();

    expect(mocks.getCarerPatients).toHaveBeenCalledWith(CARER_ID);
    const links = cardLinks();
    expect(links).toHaveLength(7);
    expect(links.map((link) => within(link).getByText(/^[A-Z][a-z]+$/).textContent)).toEqual([
      "Margaret",
      "Robert",
      "Elsie",
      "Frank",
      "Doris",
      "Harold",
      "Jean",
    ]);
    expect(within(links[0]).getByText("78 years · Preston VIC")).toBeInTheDocument();
    expect(within(links[6]).getByText("88 years · Fairfield VIC")).toBeInTheDocument();
  });

  it("[CAR-UI-02][AC-02] with no patients shows 'No patients assigned yet' and no search field", async () => {
    mocks.getCarerPatients.mockResolvedValue([]);
    await renderPatients();

    expect(screen.getByText("No patients assigned yet")).toBeInTheDocument();
    expect(cardLinks()).toHaveLength(0);
    expect(screen.queryByPlaceholderText("Search patients")).not.toBeInTheDocument();
  });

  it("[CAR-UI-02][AC-03] Margaret's card is a link to her patient page", async () => {
    await renderPatients();

    const margaret = cardLinks()[0];
    expect(margaret).toHaveAttribute("href", `/carer/patients/${MARGARET}`);
    expect(margaret).toHaveAccessibleName(/Margaret/);
  });

  it("[CAR-UI-02][AC-03] the patient page opens on the Info tab", async () => {
    await expect(PatientPage(params(MARGARET))).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith(`/carer/patients/${MARGARET}/info`);
  });

  it("[CAR-UI-02][AC-06] typing 'je' in 'Search patients' leaves only Jean", async () => {
    const user = userEvent.setup();
    await renderPatients();

    await user.type(screen.getByPlaceholderText("Search patients"), "je");

    const links = cardLinks();
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/carer/patients/client-jean");
  });

  it("[CAR-UI-02][AC-06] a search is not case-sensitive", async () => {
    const user = userEvent.setup();
    await renderPatients();

    await user.type(screen.getByPlaceholderText("Search patients"), "MARG");

    expect(cardLinks().map((link) => link.getAttribute("href"))).toEqual([
      `/carer/patients/${MARGARET}`,
    ]);
  });

  it("[CAR-UI-02][AC-06] a search with no match shows no cards and names the query", async () => {
    const user = userEvent.setup();
    await renderPatients();

    await user.type(screen.getByPlaceholderText("Search patients"), "zz");

    expect(cardLinks()).toHaveLength(0);
    expect(screen.getByText('No matches for "zz".')).toBeInTheDocument();
  });

  it("[CAR-UI-02][PRD] a very long name stays on the card without breaking the grid", async () => {
    const long = "Anastasia Wilhelmina Konstantinopoulos-Featherstone";
    mocks.getCarerPatients.mockResolvedValue([{ ...PATIENTS[0], firstName: long }]);
    await renderPatients();

    const card = cardLinks()[0];
    expect(within(card).getByText(long)).toBeInTheDocument();
    expect(card).toHaveAccessibleName(new RegExp(long));
  });
});

describe("[CAR-UI-02] Patient header and tabs", () => {
  it("[CAR-UI-02][AC-07] shows 'Back to patients', Margaret and '78 years · Preston VIC'", async () => {
    await renderLayout(MARGARET);

    expect(screen.getByRole("link", { name: /Back to patients/ })).toHaveAttribute(
      "href",
      "/carer/patients",
    );
    expect(screen.getByText("Margaret")).toBeInTheDocument();
    expect(screen.getByText("78 years · Preston VIC")).toBeInTheDocument();
    expect(screen.getByText("tab content")).toBeInTheDocument();
  });

  it("[CAR-UI-02][AC-07] has tabs Home, Calendar, Info, Care log linking to the patient's routes", async () => {
    await renderLayout(MARGARET);

    const nav = screen.getByRole("navigation", { name: /Margaret/ });
    const tabs = within(nav).getAllByRole("link");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Home", "Calendar", "Info", "Care log"]);
    expect(tabs.map((tab) => tab.getAttribute("href"))).toEqual([
      `/carer/patients/${MARGARET}/home`,
      `/carer/patients/${MARGARET}/calendar`,
      `/carer/patients/${MARGARET}/info`,
      `/carer/patients/${MARGARET}/tasks`,
    ]);
  });

  it("[CAR-UI-02][AC-07] marks only the current tab with aria-current='page'", async () => {
    await renderLayout(MARGARET, "calendar");

    const nav = screen.getByRole("navigation", { name: /Margaret/ });
    const current = within(nav)
      .getAllByRole("link")
      .filter((tab) => tab.getAttribute("aria-current") === "page");
    expect(current.map((tab) => tab.textContent)).toEqual(["Calendar"]);
  });

  it("[CAR-UI-02][AC-07] the patient header offers no Budget or Settings tab (CHG-026)", async () => {
    await renderLayout(MARGARET);

    const nav = screen.getByRole("navigation", { name: /Margaret/ });
    expect(within(nav).queryByRole("link", { name: /Budget|Settings/ })).not.toBeInTheDocument();
  });

  it("[CAR-UI-02][AC-09] a patient not in the carer's list is not found", async () => {
    await expect(
      PatientLayout({ children: <p>tab content</p>, ...params("client-stranger") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalled();
  });
});

describe("[CAR-UI-02] Patient Info tab", () => {
  it("[CAR-UI-02][AC-04] off shift (Robert), Info shows the cards with no Edit button and no 'Add file'", async () => {
    await renderInfo(ROBERT);

    expect(screen.getByRole("heading", { name: "Description" })).toBeInTheDocument();
    expect(screen.getByText("Care plan.pdf")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Add file")).not.toBeInTheDocument();
  });

  it("[CAR-UI-02][AC-05] on shift (Margaret), Info has Edit on each section and 'Add file'", async () => {
    await renderInfo(MARGARET);

    for (const title of ["Description", "Habits", "Medical history"]) {
      expect(screen.getByRole("button", { name: `Edit ${title}` })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Add file" })).toBeInTheDocument();
  });

  it("[CAR-UI-02][AC-04] reads the patient's own info through the contract", async () => {
    await renderInfo(ROBERT);

    expect(mocks.getClientInfoSections).toHaveBeenCalledWith(ROBERT);
    expect(mocks.getClientDocuments).toHaveBeenCalledWith(ROBERT);
    expect(mocks.getCarerPatients).toHaveBeenCalledWith(CARER_ID);
  });

  it("[CAR-UI-02][AC-09] Info for a patient not in the carer's list is not found", async () => {
    await expect(InfoPage(params("client-stranger"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("[CAR-UI-02] Home, Calendar and Care log holding tabs", () => {
  it.each([
    ["Home", HomeTabPage],
    ["Calendar", CalendarTabPage],
    ["Care log", CareLogTabPage],
  ])("[CAR-UI-02][AC-08] the %s tab shows 'Coming soon' and no controls", async (_name, Page) => {
    const { container } = render(await Page(params(MARGARET)));

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[CAR-UI-02] error and loading states", () => {
  it("[CAR-UI-02][AC-10] Patients shows 'Something went wrong' and 'Try again' when the read rejects, logging no client data", async () => {
    const log = captureErrorLog();
    mocks.getCarerPatients.mockRejectedValue(new Error("Margaret Doyle secret"));
    const user = userEvent.setup();
    await renderPatients();

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refresh).toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Margaret|secret/);
  });

  it("[CAR-UI-02][AC-10] Info shows 'Something went wrong' and 'Try again' when the info read rejects, logging no client data", async () => {
    const log = captureErrorLog();
    mocks.getClientInfoSections.mockRejectedValue(new Error("Margaret Doyle secret"));
    await renderInfo(MARGARET);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Margaret|secret/);
  });

  it.each([
    ["Patients", PatientsLoading],
    ["Info", InfoLoading],
  ])("[CAR-UI-02][AC-11] the %s skeleton announces 'Loading' and holds no data", (_name, Loading) => {
    render(<Loading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Margaret|Jean|years/)).not.toBeInTheDocument();
  });
});

describe("[CAR-UI-02] accessibility (REQ-N2)", () => {
  it("[CAR-UI-02][AC-12] populated Patients has no axe violations", async () => {
    const { container } = await renderPatients();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-02][AC-12] empty Patients has no axe violations", async () => {
    mocks.getCarerPatients.mockResolvedValue([]);
    const { container } = await renderPatients();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-02][AC-12] the Patients error state has no axe violations", async () => {
    captureErrorLog();
    mocks.getCarerPatients.mockRejectedValue(new Error("x"));
    const { container } = await renderPatients();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-02][AC-12] the loading skeletons have no axe violations", async () => {
    const patients = render(<PatientsLoading />);
    expect(await axe(patients.container)).toHaveNoViolations();
    patients.unmount();
    const info = render(<InfoLoading />);
    expect(await axe(info.container)).toHaveNoViolations();
  });

  it("[CAR-UI-02][AC-12] the patient header, tabs and Info have no axe violations", async () => {
    const header = await renderLayout(MARGARET);
    expect(await axe(header.container)).toHaveNoViolations();
    header.unmount();
    const info = await renderInfo(MARGARET);
    expect(await axe(info.container)).toHaveNoViolations();
  });
});
