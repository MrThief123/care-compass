import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CarerCalendarPage from "@/app/(carer)/carer/patients/[clientId]/calendar/page";
import CarerHomePage from "@/app/(carer)/carer/patients/[clientId]/home/page";
import CarerCareLogPage from "@/app/(carer)/carer/patients/[clientId]/tasks/page";
import FamilyCalendarPage from "@/app/(family)/family/[clientId]/calendar/page";
import FamilyHomePage from "@/app/(family)/family/[clientId]/home/page";
import type { CarerPatientRow } from "@/server/shifts/queries";
import type { BudgetBucketSummary, Occurrence, TaskLogResult } from "@/types/domain";

/*
 * CAR-06 — Carer · Mark tasks done. A carer ticks off from the patient's own Calendar (CHG-026),
 * and CAR-06 wires that Calendar, Home and Care log (CHG-043). The screens read and write only
 * through the `src/server/**` contract, so these tests replace it. The database side
 * (`set_occurrence_done`, shift-only) is tests/integration/carer-complete-task.test.ts and F0-11's
 * pgTAP; the journey is tests/e2e/carer-complete-task.spec.ts.
 */
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  pathname: { current: "/carer/patients/client-margaret/calendar" },
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT ${href}`);
  }),
  getCurrentUser: vi.fn(),
  getCarerPatients: vi.fn(),
  getToday: vi.fn(),
  getOccurrences: vi.fn(),
  getTodayOccurrences: vi.fn(),
  getTaskLog: vi.fn(),
  getBudgetSummary: vi.fn(),
  setOccurrenceDone: vi.fn(),
  setOccurrenceUndone: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => mocks.pathname.current,
  useSearchParams: () => new URLSearchParams(),
  redirect: mocks.redirect,
  notFound: vi.fn(),
}));
vi.mock("@/server/auth/queries", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/shifts/queries", () => ({ getCarerPatients: mocks.getCarerPatients }));
vi.mock("@/server/events/queries", () => ({
  getToday: mocks.getToday,
  getOccurrences: mocks.getOccurrences,
  getTodayOccurrences: mocks.getTodayOccurrences,
  getTaskLog: mocks.getTaskLog,
}));
vi.mock("@/server/budget/queries", () => ({ getBudgetSummary: mocks.getBudgetSummary }));
vi.mock("@/server/events/actions", () => ({
  setOccurrenceDone: mocks.setOccurrenceDone,
  setOccurrenceUndone: mocks.setOccurrenceUndone,
}));

const MARGARET = "client-margaret"; // Aisha's shift is in progress
const ROBERT = "client-robert"; // only a future shift: view only

const AISHA = {
  profileId: "staff-aisha",
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

const at = (date: string, time: string) => `${date}T${time}:00+11:00`;

function occurrence(
  clientId: string,
  fields: Pick<Occurrence, "title" | "start" | "status"> & Partial<Occurrence>,
): Occurrence {
  const eventId = `event-${clientId}-${fields.title.toLowerCase().replace(/\W+/g, "-")}`;
  return {
    key: `${eventId}:${fields.start}`,
    eventId,
    clientId,
    description: "",
    durationMinutes: 60,
    ...fields,
  };
}

function week(clientId: string): Occurrence[] {
  return [
    occurrence(clientId, {
      title: "Morning medication",
      start: at("2026-11-30", "09:00"),
      status: "done",
      actor: "Helen Doyle",
    }),
    occurrence(clientId, {
      title: "Physiotherapy",
      start: at("2026-11-30", "11:30"),
      status: "planned",
    }),
    occurrence(clientId, {
      title: "Weekly weigh-in",
      start: at("2026-11-29", "09:30"),
      status: "overdue",
    }),
  ];
}

function taskLog(items: Occurrence[]): TaskLogResult {
  return { items, page: 1, pageSize: 20, total: items.length };
}

const BUCKET: BudgetBucketSummary = {
  id: "bucket-core",
  label: "Core supports",
  total: 1000,
  used: 200,
  remaining: 800,
  percentUsed: 20,
  state: "ok",
};

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue(AISHA);
  mocks.getCarerPatients.mockResolvedValue(PATIENTS);
  mocks.getToday.mockResolvedValue("2026-11-30");
  mocks.getOccurrences.mockImplementation(async (clientId: string) => week(clientId));
  mocks.getTodayOccurrences.mockImplementation(async (clientId: string) =>
    week(clientId).filter((o) => o.start.startsWith("2026-11-30")),
  );
  mocks.getTaskLog.mockImplementation(async (clientId: string) => taskLog(week(clientId)));
  mocks.getBudgetSummary.mockResolvedValue([BUCKET]);
  mocks.setOccurrenceDone.mockResolvedValue({
    ok: true,
    data: { actor: "Aisha Rahman", completedAt: "2026-11-30T11:40:00+11:00" },
  });
  mocks.setOccurrenceUndone.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const params = (clientId: string) => ({ params: Promise.resolve({ clientId }) });
const withSearch = (clientId: string, search: Record<string, string> = {}) => ({
  ...params(clientId),
  searchParams: Promise.resolve(search),
});

const renderCarerCalendar = async (clientId = MARGARET) =>
  render(await CarerCalendarPage(withSearch(clientId)));
const renderCarerHome = async (clientId = MARGARET) =>
  render(await CarerHomePage(params(clientId)));
const renderCarerCareLog = async (clientId = MARGARET) =>
  render(await CarerCareLogPage(withSearch(clientId)));

const tasksPanel = () => screen.getByRole("region", { name: "Tasks" });
const hrefs = (container: HTMLElement) =>
  [...container.querySelectorAll("a[href]")].map((a) => a.getAttribute("href") ?? "");

const PHYSIO_KEY = `event-${MARGARET}-physiotherapy:2026-11-30T11:30:00+11:00`;
const MEDICATION_KEY = `event-${MARGARET}-morning-medication:2026-11-30T09:00:00+11:00`;

describe("[CAR-06][AC-04] a carer on shift ticks and unticks in the patient's Calendar", () => {
  it("[CAR-06][AC-04] T-04 ticking Physiotherapy marks it done at once and calls setOccurrenceDone with its key", async () => {
    const user = userEvent.setup();
    await renderCarerCalendar();
    const box = within(tasksPanel()).getByLabelText("Physiotherapy");
    expect(box).not.toBeChecked();

    await user.click(box);

    expect(box).toBeChecked();
    expect(mocks.setOccurrenceDone).toHaveBeenCalledWith(PHYSIO_KEY);
    expect(mocks.setOccurrenceUndone).not.toHaveBeenCalled();
  });

  it("[CAR-06][AC-04] T-04 unticking a done task calls setOccurrenceUndone with its key", async () => {
    const user = userEvent.setup();
    await renderCarerCalendar();
    const box = within(tasksPanel()).getByLabelText("Morning medication");
    expect(box).toBeChecked();

    await user.click(box);

    expect(box).not.toBeChecked();
    expect(mocks.setOccurrenceUndone).toHaveBeenCalledWith(MEDICATION_KEY);
  });
});

describe("[CAR-06][AC-03] a rejected completion reverts the checkbox", () => {
  it("[CAR-06][AC-03] T-03 given the server rejects the tick, the checkbox returns to unticked and an error is shown", async () => {
    mocks.setOccurrenceDone.mockResolvedValue({
      ok: false,
      error: { code: "NOT_ALLOWED", message: "Your shift has ended, so you can't tick this off." },
    });
    const user = userEvent.setup();
    await renderCarerCalendar();
    const box = within(tasksPanel()).getByLabelText("Physiotherapy");

    await user.click(box);

    await screen.findByText("Your shift has ended, so you can't tick this off.");
    expect(box).not.toBeChecked();
  });
});

describe("[CAR-06][AC-02] off shift the Calendar is view only", () => {
  it("[CAR-06][AC-02] T-02 given no shift in progress with Robert, tasks are listed with their status, no checkboxes, and a View only notice shows", async () => {
    await renderCarerCalendar(ROBERT);

    const panel = tasksPanel();
    expect(within(panel).getByText("Physiotherapy")).toBeVisible();
    expect(within(panel).getByText("Morning medication")).toBeVisible();
    // Status is text, not colour alone, and nothing is ticked off.
    expect(within(panel).getAllByText(/Done|Planned|Overdue/i).length).toBeGreaterThan(0);
    expect(within(panel).queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("note")).toHaveTextContent(/View only/);
    expect(mocks.setOccurrenceDone).not.toHaveBeenCalled();
  });
});

describe("[CAR-06][AC-06] Calendar, Home and Care log read the patient's data and stay in the carer area", () => {
  it("[CAR-06][AC-06] T-06 the Calendar reads Margaret's days and every link stays under her carer pages", async () => {
    const { container } = await renderCarerCalendar();

    expect(mocks.getOccurrences).toHaveBeenCalledWith(MARGARET, expect.anything());
    const links = hrefs(container);
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) expect(href.startsWith(`/carer/patients/${MARGARET}/`)).toBe(true);
    expect(container.innerHTML).not.toContain("/family/");
  });

  it("[CAR-06][AC-06] T-06 stepping the Calendar navigates inside the carer area", async () => {
    const user = userEvent.setup();
    await renderCarerCalendar();

    await user.click(screen.getByRole("button", { name: "Next week" }));

    expect(mocks.push).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^/carer/patients/${MARGARET}/calendar\\?`)),
    );
  });

  it("[CAR-06][AC-06] T-06 Home shows Margaret's day and budget with every link under her carer pages", async () => {
    const { container } = await renderCarerHome();

    expect(mocks.getTodayOccurrences).toHaveBeenCalledWith(MARGARET);
    expect(screen.getByText("Physiotherapy")).toBeVisible();
    expect(screen.getByText("Core supports")).toBeVisible();
    for (const href of hrefs(container)) {
      expect(href.startsWith(`/carer/patients/${MARGARET}/`)).toBe(true);
    }
    expect(container.innerHTML).not.toContain("/family/");
  });

  it("[CAR-06][AC-06] T-06 the Care log lists Margaret's tasks and every link stays under her carer pages", async () => {
    const { container } = await renderCarerCareLog();

    expect(mocks.getTaskLog).toHaveBeenCalledWith(MARGARET, expect.anything());
    expect(screen.getByText("Weekly weigh-in")).toBeVisible();
    const links = hrefs(container);
    expect(links.some((href) => href.includes("/tasks/event-"))).toBe(true);
    for (const href of links) expect(href.startsWith(`/carer/patients/${MARGARET}/`)).toBe(true);
    expect(container.innerHTML).not.toContain("/family/");
  });
});

describe("[CAR-06][AC-07] carers never get the family-only controls", () => {
  // CHG-048 (CAR-07): on shift the Calendar has 'Enter event' and Task detail has 'Edit event',
  // so the Add/Edit event half of this test now allows exactly those two, on shift only
  // (HUMAN REVIEW: test expectation changed, CAR-07 FD-03). Home, Care log and the budget link
  // are unchanged. The Home also has 'Enter event' on shift (CAR-07 FD-08, HUMAN REVIEW).
  it.each([["Care log", renderCarerCareLog, "Weekly weigh-in"]])(
    "[CAR-06][AC-07] T-07 %s on shift has no Add event, Edit event or View breakdown link",
    async (_name, renderIt, shows) => {
      const { container } = await renderIt();

      // The screen is really there (not the 'Coming soon' holding state).
      expect(screen.getAllByText(shows).length).toBeGreaterThan(0);
      expect(
        screen.queryByRole("link", { name: /enter event|add event/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /edit event/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /view breakdown/i })).not.toBeInTheDocument();
      expect(hrefs(container).some((href) => /\/(events|budget)(\/|$)/.test(href))).toBe(false);
    },
  );

  it("[CAR-06][AC-07] T-07 the Calendar on shift has Enter event (CAR-07) but no Edit event or View breakdown link", async () => {
    const { container } = await renderCarerCalendar();

    expect(screen.getAllByText("Physiotherapy").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      expect.stringMatching(new RegExp(`^/carer/patients/${MARGARET}/events/new`)),
    );
    expect(screen.queryByRole("link", { name: /edit event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view breakdown/i })).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain("/family/");
  });

  it("[CAR-06][AC-07] T-07 the Home on shift has Enter event (CAR-07) but no Edit event or View breakdown link", async () => {
    const { container } = await renderCarerHome();

    expect(screen.getAllByText("Physiotherapy").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      `/carer/patients/${MARGARET}/events/new`,
    );
    expect(screen.queryByRole("link", { name: /edit event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view breakdown/i })).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain("/family/");
  });

  it("[CAR-06][AC-07] T-07 Home has no tick boxes, on shift or off", async () => {
    await renderCarerHome();
    expect(screen.getByText("Physiotherapy")).toBeVisible();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("[CAR-06][AC-07] T-07 off shift the controls are still absent", async () => {
    const { container } = await renderCarerHome(ROBERT);

    expect(screen.getByText("Physiotherapy")).toBeVisible();
    expect(screen.queryByRole("link", { name: /enter event|add event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view breakdown/i })).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain("/family/");
  });

  it("[CAR-06][AC-07] T-07 off shift the Calendar has no Add event link either", async () => {
    await renderCarerCalendar(ROBERT);

    expect(screen.queryByRole("link", { name: /enter event|add event/i })).not.toBeInTheDocument();
  });
});

describe("[CAR-06][AC-08] the Family screens are unchanged", () => {
  const FAMILY_USER = { firstName: "Helen", lastName: "Doyle" };

  it("[CAR-06][AC-08] T-08 the Family Calendar keeps its /family links, Enter event and tick boxes", async () => {
    mocks.getCurrentUser.mockResolvedValue(FAMILY_USER);
    const { container } = render(await FamilyCalendarPage(withSearch(MARGARET)));

    expect(within(tasksPanel()).getByLabelText("Physiotherapy")).toBeEnabled();
    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      expect.stringMatching(new RegExp(`^/family/${MARGARET}/events/new`)),
    );
    expect(container.innerHTML).not.toContain("/carer/");
  });

  it("[CAR-06][AC-08] T-08 the Family Home keeps its /family links, Enter event and View breakdown", async () => {
    const { container } = render(await FamilyHomePage(params(MARGARET)));

    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      `/family/${MARGARET}/events/new`,
    );
    expect(screen.getByRole("link", { name: "View breakdown" })).toHaveAttribute(
      "href",
      `/family/${MARGARET}/budget`,
    );
    expect(container.innerHTML).not.toContain("/carer/");
  });
});
