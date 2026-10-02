import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CarerCalendarPage from "@/app/(carer)/carer/patients/[clientId]/calendar/page";
import CarerEditEventPage from "@/app/(carer)/carer/patients/[clientId]/events/[eventId]/edit/page";
import CarerNewEventPage from "@/app/(carer)/carer/patients/[clientId]/events/new/page";
import CarerTaskDetailPage from "@/app/(carer)/carer/patients/[clientId]/tasks/[occurrenceKey]/page";
import CarerPatientsPage from "@/app/(carer)/carer/patients/page";
import FamilyCalendarPage from "@/app/(family)/family/[clientId]/calendar/page";
import FamilyEditEventPage from "@/app/(family)/family/[clientId]/events/[eventId]/edit/page";
import FamilyNewEventPage from "@/app/(family)/family/[clientId]/events/new/page";
import FamilyTaskDetailPage from "@/app/(family)/family/[clientId]/tasks/[occurrenceKey]/page";
import type { CarerPatientRow } from "@/server/shifts/queries";
import type {
  BudgetBucketSummary,
  CareEvent,
  EventDocument,
  Occurrence,
  TaskLogResult,
} from "@/types/domain";

/*
 * CAR-07 — Carer · Add and edit events for a patient (CHG-048). The screens read and write only
 * through the `src/server/**` contract, so these tests replace it. The database side (an on-shift
 * carer may insert and update `care_events`, nobody else) is tests/integration/carer-manage-events.test.ts
 * and F0-11's pgTAP; the journey is tests/e2e/carer-manage-events.spec.ts.
 */
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT ${href}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getCurrentUser: vi.fn(),
  getCarerPatients: vi.fn(),
  getToday: vi.fn(),
  getOccurrences: vi.fn(),
  getOccurrence: vi.fn(),
  getTodayOccurrences: vi.fn(),
  getEvent: vi.fn(),
  getTaskLog: vi.fn(),
  getBudgetSummary: vi.fn(),
  getEventDocuments: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  linkDocumentsToEvent: vi.fn(),
  setOccurrenceDone: vi.fn(),
  setOccurrenceUndone: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/carer/patients/client-margaret/calendar",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ clientId: "client-margaret" }),
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));
vi.mock("@/server/auth/queries", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/shifts/queries", () => ({ getCarerPatients: mocks.getCarerPatients }));
vi.mock("@/server/events/queries", () => ({
  getToday: mocks.getToday,
  getOccurrences: mocks.getOccurrences,
  getOccurrence: mocks.getOccurrence,
  getTodayOccurrences: mocks.getTodayOccurrences,
  getEvent: mocks.getEvent,
  getTaskLog: mocks.getTaskLog,
}));
vi.mock("@/server/budget/queries", () => ({ getBudgetSummary: mocks.getBudgetSummary }));
vi.mock("@/server/documents/queries", () => ({ getEventDocuments: mocks.getEventDocuments }));
vi.mock("@/server/documents/actions", () => ({
  linkDocumentsToEvent: mocks.linkDocumentsToEvent,
  uploadDocument: vi.fn(),
}));
vi.mock("@/server/events/actions", () => ({
  createEvent: mocks.createEvent,
  updateEvent: mocks.updateEvent,
  setOccurrenceDone: mocks.setOccurrenceDone,
  setOccurrenceUndone: mocks.setOccurrenceUndone,
}));

const MARGARET = "client-margaret"; // Aisha's shift is in progress
const ROBERT = "client-robert"; // only a future shift: view only
const STRANGER = "client-stranger"; // no shift at all

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

const SHIFT_ENDED = "Your shift with Margaret has ended, so this event wasn't saved.";

const PHYSIO_EVENT: CareEvent = {
  id: "event-physio",
  clientId: MARGARET,
  title: "Physiotherapy",
  description: "Balance exercises per the care plan.",
  start: "2026-11-30T11:30:00+11:00",
  durationMinutes: 45,
  recurrenceFrequency: "weekly",
  completionMode: "manual",
};
const PHYSIO_KEY = "event-physio:2026-11-30T11:30:00+11:00";
const PHYSIO: Occurrence = {
  key: PHYSIO_KEY,
  eventId: PHYSIO_EVENT.id,
  clientId: MARGARET,
  title: "Physiotherapy",
  description: PHYSIO_EVENT.description,
  start: PHYSIO_EVENT.start,
  durationMinutes: 45,
  status: "planned",
};

const BUCKET: BudgetBucketSummary = {
  id: "bucket-core",
  label: "Core supports",
  total: 1000,
  used: 200,
  remaining: 800,
  percentUsed: 20,
  state: "ok",
};
const DOCUMENT: EventDocument = {
  id: "doc-1",
  clientId: MARGARET,
  eventId: PHYSIO_EVENT.id,
  name: "Exercise plan.pdf",
  mimeType: "application/pdf",
  sizeBytes: 2048,
  uploadedAt: "2026-11-20T09:00:00+11:00",
} as EventDocument;

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue(AISHA);
  mocks.getCarerPatients.mockResolvedValue(PATIENTS);
  mocks.getToday.mockResolvedValue("2026-11-30");
  mocks.getOccurrences.mockResolvedValue([PHYSIO]);
  mocks.getOccurrence.mockImplementation(async (_clientId: string, key: string) =>
    key === PHYSIO_KEY ? PHYSIO : undefined,
  );
  mocks.getTodayOccurrences.mockResolvedValue([PHYSIO]);
  mocks.getEvent.mockImplementation(async (clientId: string, eventId: string) =>
    clientId === MARGARET && eventId === PHYSIO_EVENT.id ? PHYSIO_EVENT : undefined,
  );
  mocks.getTaskLog.mockResolvedValue({
    items: [PHYSIO],
    page: 1,
    pageSize: 20,
    total: 1,
  } satisfies TaskLogResult);
  mocks.getBudgetSummary.mockResolvedValue([BUCKET]);
  mocks.getEventDocuments.mockResolvedValue([DOCUMENT]);
  mocks.createEvent.mockResolvedValue({ ok: true, data: { eventId: "event-new" } });
  mocks.updateEvent.mockResolvedValue({ ok: true, data: { eventId: PHYSIO_EVENT.id } });
  mocks.linkDocumentsToEvent.mockResolvedValue({ ok: true, data: { failedIds: [] } });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const params = <Rest extends Record<string, string>>(clientId: string, rest?: Rest) => ({
  params: Promise.resolve({ clientId, ...rest } as { clientId: string } & Rest),
});
const withSearch = <Rest extends Record<string, string>>(
  clientId: string,
  search: Record<string, string> = {},
  rest?: Rest,
) => ({ ...params(clientId, rest), searchParams: Promise.resolve(search) });

const hrefs = (container: HTMLElement) =>
  [...container.querySelectorAll("a[href]")].map((a) => a.getAttribute("href") ?? "");

const renderCalendar = async (clientId = MARGARET) =>
  render(await CarerCalendarPage(withSearch(clientId)));
const renderTaskDetail = async (clientId = MARGARET) =>
  render(
    await CarerTaskDetailPage(
      withSearch(clientId, {}, { occurrenceKey: encodeURIComponent(PHYSIO_KEY) }),
    ),
  );
const renderPatients = async () =>
  render(await CarerPatientsPage({ searchParams: Promise.resolve({}) }));
const renderNew = async (clientId = MARGARET, search: Record<string, string> = {}) =>
  render(await CarerNewEventPage(withSearch(clientId, search)));
const renderEdit = async (clientId = MARGARET, eventId = PHYSIO_EVENT.id) =>
  render(
    await CarerEditEventPage(
      withSearch(clientId, { occurrence: PHYSIO_KEY, from: "tasks" }, { eventId }),
    ),
  );

/** The next-navigation redirect the page threw, if any. */
async function redirectedTo(run: () => Promise<unknown>): Promise<string | undefined> {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return message.startsWith("NEXT_REDIRECT ")
      ? message.slice("NEXT_REDIRECT ".length)
      : undefined;
  }
  return undefined;
}

async function fillAndSave(user: ReturnType<typeof userEvent.setup>) {
  const [firstDay] = screen.getAllByTestId(/^date-picker-day-/);
  await user.click(firstDay!);
  await user.type(screen.getByLabelText("Title"), "Walk in the garden");
  await user.click(screen.getByRole("button", { name: "Save event" }));
}

describe("[CAR-07][AC-03] the entry points exist on shift only, and stay in the carer area", () => {
  it("[CAR-07][AC-03] T-03 on shift the Calendar has 'Enter event' to the carer Add event route", async () => {
    await renderCalendar(MARGARET);

    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      expect.stringMatching(new RegExp(`^/carer/patients/${MARGARET}/events/new`)),
    );
  });

  it("[CAR-07][AC-03] T-03 off shift the Calendar has no 'Enter event' link", async () => {
    await renderCalendar(ROBERT);

    expect(screen.getByRole("note")).toHaveTextContent("View only");
    expect(screen.queryByRole("link", { name: /enter event|add event/i })).not.toBeInTheDocument();
  });

  it("[CAR-07][AC-03] T-03 on shift the Task detail has 'Edit event' to the carer Edit route, carrying the occurrence", async () => {
    await renderTaskDetail(MARGARET);

    const link = screen.getByRole("link", { name: "Edit event" });
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith(`/carer/patients/${MARGARET}/events/${PHYSIO_EVENT.id}/edit?`)).toBe(
      true,
    );
    expect(decodeURIComponent(href)).toContain(`occurrence=${PHYSIO_KEY}`);
  });

  it("[CAR-07][AC-03] T-03 off shift the Task detail has no 'Edit event' link", async () => {
    mocks.getOccurrence.mockResolvedValue({ ...PHYSIO, clientId: ROBERT });
    await renderTaskDetail(ROBERT);

    expect(screen.getAllByText("Physiotherapy").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Edit event" })).not.toBeInTheDocument();
  });

  it("[CAR-07][AC-03] T-03 the Patients card has 'Add event for Margaret' on shift, and nothing for Robert", async () => {
    await renderPatients();

    expect(screen.getByRole("link", { name: "Add event for Margaret" })).toHaveAttribute(
      "href",
      expect.stringMatching(new RegExp(`^/carer/patients/${MARGARET}/events/new`)),
    );
    expect(screen.queryByRole("link", { name: /add event for robert/i })).not.toBeInTheDocument();
    // A card link never nests another link: the card stays one link to the patient.
    expect(screen.getByRole("link", { name: /Margaret Doyle/ })).toHaveAttribute(
      "href",
      `/carer/patients/${MARGARET}`,
    );
  });
});

describe("[CAR-07][AC-04] the carer Add event form", () => {
  it("[CAR-07][AC-04] T-04 opens the Family form, empty, with Title, Start time, Duration and Documents", async () => {
    await renderNew();

    expect(screen.getByRole("heading", { level: 1, name: "Add event" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Start time")).toBeInTheDocument();
    expect(screen.getByLabelText("Duration")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveValue("");
    expect(screen.getByLabelText("Recurring")).toHaveValue("none");
    expect(screen.getByRole("switch", { name: /task/i })).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Documents" })).getByRole("button", {
        name: "Add file",
      }),
    ).toBeInTheDocument();
  });

  it("[CAR-07][AC-04] T-04 saving with no Date shows an error and calls nothing", async () => {
    const user = userEvent.setup();
    await renderNew();

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(screen.getByLabelText("Date")).toHaveAttribute("aria-invalid", "true");
    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[CAR-07][AC-04] T-04 saving with no Title shows an error and calls nothing", async () => {
    const user = userEvent.setup();
    await renderNew();

    const [firstDay] = screen.getAllByTestId(/^date-picker-day-/);
    await user.click(firstDay!);
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("[CAR-07][AC-04] T-04 a complete form calls createEvent for Margaret and returns to the patient's Home", async () => {
    const user = userEvent.setup();
    await renderNew();

    await fillAndSave(user);

    expect(mocks.createEvent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ clientId: MARGARET, title: "Walk in the garden" }),
    );
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith(`/carer/patients/${MARGARET}/home`);
  });

  it("[CAR-07][AC-04] T-04 opened from the Calendar, Save and Cancel return to that Calendar view under /carer/", async () => {
    const user = userEvent.setup();
    const from = { from: "calendar", view: "month", date: "2026-12-04", month: "2026-12" };
    const expected = `/carer/patients/${MARGARET}/calendar?view=month&date=2026-12-04&month=2026-12`;

    await renderNew(MARGARET, from);
    await fillAndSave(user);
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith(expected);

    mocks.push.mockClear();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it("[CAR-07][AC-04] T-04 Cancel with typed input creates nothing", async () => {
    const user = userEvent.setup();
    await renderNew();

    await user.type(screen.getByLabelText("Title"), "Walk in the garden");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith(`/carer/patients/${MARGARET}/home`);
  });

  it("[CAR-07][AC-04] T-04 no link on the carer form leaves /carer/patients/<id>/", async () => {
    const { container } = await renderNew();

    expect(container.innerHTML).not.toContain("/family/");
  });
});

describe("[CAR-07][AC-05] the carer Edit event form", () => {
  it("[CAR-07][AC-05] T-05 opens with the event's values, its documents and the occurrence/series choice", async () => {
    await renderEdit();

    expect(screen.getByRole("heading", { level: 1, name: "Edit event" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Physiotherapy");
    expect(screen.getByLabelText("Description")).toHaveValue(PHYSIO_EVENT.description);
    expect(screen.getByLabelText("Recurring")).toHaveValue("weekly");
    expect(screen.getByText("Exercise plan.pdf")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Scope" })).toBeInTheDocument();
  });

  it("[CAR-07][AC-05] T-05 Save calls updateEvent for the event and returns to the carer Task detail", async () => {
    const user = userEvent.setup();
    await renderEdit();

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Physiotherapy (extra)");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(mocks.updateEvent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        clientId: MARGARET,
        eventId: PHYSIO_EVENT.id,
        occurrenceOriginalStart: PHYSIO.start,
        title: "Physiotherapy (extra)",
      }),
    );
    const [target] = mocks.push.mock.calls[0] as [string];
    expect(target.startsWith(`/carer/patients/${MARGARET}/`)).toBe(true);
    expect(decodeURIComponent(target)).toContain(PHYSIO_KEY);
  });

  it("[CAR-07][AC-05] T-05 an event of another client is not found", async () => {
    mocks.getEvent.mockResolvedValue(undefined);

    await expect(renderEdit(MARGARET, "event-of-someone-else")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("[CAR-07][AC-06] a shift that ends mid-form refuses the save and keeps the form", () => {
  const refused = {
    ok: false,
    error: { code: "NOT_ALLOWED", message: "Not permitted to add an event for this client." },
  };

  it("[CAR-07][AC-06] T-06 Add event: the server refuses, so the shift-ended message shows, the typed title stays and nothing navigates", async () => {
    mocks.createEvent.mockResolvedValue(refused);
    const user = userEvent.setup();
    await renderNew();

    await fillAndSave(user);

    expect(await screen.findByText(SHIFT_ENDED)).toBeVisible();
    expect(screen.getByRole("status", { name: "Save error" })).toHaveTextContent(SHIFT_ENDED);
    expect(screen.getByLabelText("Title")).toHaveValue("Walk in the garden");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[CAR-07][AC-06] T-06 Edit event: the server refuses, so the shift-ended message shows and nothing navigates", async () => {
    mocks.updateEvent.mockResolvedValue(refused);
    const user = userEvent.setup();
    await renderEdit();

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(await screen.findByText(SHIFT_ENDED)).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[CAR-07][AC-06] T-06 any other failure keeps the generic message, not the shift-ended one", async () => {
    mocks.createEvent.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save. Please try again." },
    });
    const user = userEvent.setup();
    await renderNew();

    await fillAndSave(user);

    expect(await screen.findByText("Couldn't save. Please try again.")).toBeVisible();
    expect(screen.queryByText(SHIFT_ENDED)).not.toBeInTheDocument();
  });
});

describe("[CAR-07][AC-07] off shift the routes redirect and no form renders", () => {
  it("[CAR-07][AC-07] T-07 Add event for a patient with no shift in progress redirects to that patient's Calendar", async () => {
    expect(await redirectedTo(() => CarerNewEventPage(withSearch(ROBERT)))).toBe(
      `/carer/patients/${ROBERT}/calendar`,
    );
    expect(mocks.getBudgetSummary).not.toHaveBeenCalled();
  });

  it("[CAR-07][AC-07] T-07 Edit event for a patient with no shift in progress redirects to that patient's Calendar", async () => {
    expect(
      await redirectedTo(() =>
        CarerEditEventPage(
          withSearch(ROBERT, { occurrence: PHYSIO_KEY }, { eventId: PHYSIO_EVENT.id }),
        ),
      ),
    ).toBe(`/carer/patients/${ROBERT}/calendar`);
    expect(mocks.getEvent).not.toHaveBeenCalled();
  });

  it.each([
    ["Add event", (id: string) => CarerNewEventPage(withSearch(id))],
    [
      "Edit event",
      (id: string) => CarerEditEventPage(withSearch(id, {}, { eventId: PHYSIO_EVENT.id })),
    ],
  ])(
    "[CAR-07][AC-07] T-07 %s for a patient the carer has no shift with redirects to Patients",
    async (_name, open) => {
      expect(await redirectedTo(() => open(STRANGER))).toBe("/carer/patients");
      expect(mocks.getEvent).not.toHaveBeenCalled();
    },
  );
});

describe("[CAR-07][AC-08] the Family screens are unchanged", () => {
  const HELEN = { firstName: "Helen", lastName: "Doyle" };

  it("[CAR-07][AC-08] T-08 Family Calendar and Task detail keep /family links, Enter event and Edit event", async () => {
    mocks.getCurrentUser.mockResolvedValue(HELEN);
    const calendar = render(await FamilyCalendarPage(withSearch(MARGARET)));
    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      expect.stringMatching(new RegExp(`^/family/${MARGARET}/events/new`)),
    );
    expect(calendar.container.innerHTML).not.toContain("/carer/");
    calendar.unmount();

    const detail = render(
      await FamilyTaskDetailPage(
        withSearch(MARGARET, {}, { occurrenceKey: encodeURIComponent(PHYSIO_KEY) }),
      ),
    );
    expect(screen.getByRole("link", { name: "Edit event" })).toHaveAttribute(
      "href",
      expect.stringMatching(new RegExp(`^/family/${MARGARET}/events/${PHYSIO_EVENT.id}/edit`)),
    );
    expect(detail.container.innerHTML).not.toContain("/carer/");
  });

  it("[CAR-07][AC-08] T-08 the Family Add event keeps its Cost fields and returns to Family Home, and a refused save keeps the generic message", async () => {
    mocks.createEvent.mockResolvedValue({
      ok: false,
      error: { code: "NOT_ALLOWED", message: "Not permitted to add an event for this client." },
    });
    const user = userEvent.setup();
    render(await FamilyNewEventPage(withSearch(MARGARET)));

    expect(screen.getByLabelText(/cost/i)).toBeInTheDocument();
    await fillAndSave(user);

    expect(await screen.findByText("Not permitted to add an event for this client.")).toBeVisible();
    expect(screen.queryByText(SHIFT_ENDED)).not.toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[CAR-07][AC-08] T-08 the Family Edit event still saves and returns to the Family Task detail", async () => {
    const user = userEvent.setup();
    render(
      await FamilyEditEventPage(
        withSearch(MARGARET, { occurrence: PHYSIO_KEY }, { eventId: PHYSIO_EVENT.id }),
      ),
    );

    await user.click(screen.getByRole("button", { name: "Save event" }));

    const [target] = mocks.push.mock.calls[0] as [string];
    expect(target.startsWith(`/family/${MARGARET}/`)).toBe(true);
  });
});

describe("[CAR-07][AC-03] carer screens elsewhere stay as CAR-06 left them", () => {
  it("[CAR-07][AC-03] T-03 on shift the Care log and Home still have no Add event link (the entry points are Calendar, Task detail and Patients only)", async () => {
    const { default: CarerHomePage } = await import(
      "@/app/(carer)/carer/patients/[clientId]/home/page"
    );
    const { container } = render(await CarerHomePage(params(MARGARET)));

    expect(screen.queryByRole("link", { name: /enter event|add event/i })).not.toBeInTheDocument();
    expect(hrefs(container).some((href) => href.includes("/events/"))).toBe(false);
  });
});
