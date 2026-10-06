import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { cloneElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CalendarError from "@/app/(family)/family/[clientId]/calendar/error";
import CalendarLoading from "@/app/(family)/family/[clientId]/calendar/loading";
import FamilyCalendarPage from "@/app/(family)/family/[clientId]/calendar/page";
import type { Occurrence, TaskLogResult } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getToday: vi.fn(),
  getOccurrences: vi.fn(),
  getClientShifts: vi.fn(),
  getTaskLog: vi.fn(),
  getCurrentUser: vi.fn(),
  setOccurrenceDone: vi.fn(),
  setOccurrenceUndone: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/server/events/queries", () => ({
  getToday: mocks.getToday,
  getOccurrences: mocks.getOccurrences,
  getClientShifts: mocks.getClientShifts,
  getTaskLog: mocks.getTaskLog,
}));
vi.mock("@/server/auth/queries", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/events/actions", () => ({
  setOccurrenceDone: mocks.setOccurrenceDone,
  setOccurrenceUndone: mocks.setOccurrenceUndone,
}));

/*
 * The screen reads only through the `src/server/**` contract, so these tests
 * replace it with rows that mirror `family-02-calendar.png` (TEST_PLAN "Test
 * data": a test may create its own fixtures).
 */
const CLIENT_ID = "client-margaret";

function occurrence(
  fields: Pick<Occurrence, "title" | "start" | "status"> & Partial<Occurrence>,
): Occurrence {
  const eventId = `event-${fields.title.toLowerCase().replace(/\W+/g, "-")}`;
  return {
    key: `${eventId}:${fields.start}`,
    eventId,
    clientId: CLIENT_ID,
    description: "",
    durationMinutes: 60,
    ...fields,
  };
}

const at = (date: string, time: string) => `${date}T${time}:00+11:00`;

const DESIGN_WEEK: Occurrence[] = [
  occurrence({
    title: "Morning medication",
    start: at("2026-11-30", "09:00"),
    status: "done",
    actor: "Aisha Rahman",
  }),
  occurrence({
    title: "Physiotherapy",
    start: at("2026-11-30", "11:30"),
    durationMinutes: 90,
    status: "planned",
  }),
  occurrence({ title: "Afternoon check-in", start: at("2026-11-30", "15:00"), status: "planned" }),
  occurrence({ title: "Morning medication", start: at("2026-12-01", "09:00"), status: "planned" }),
  occurrence({
    title: "Wound dressing check",
    start: at("2026-12-02", "10:00"),
    durationMinutes: 30,
    status: "planned",
  }),
  occurrence({
    title: "Weekly weigh-in",
    start: at("2026-12-03", "09:30"),
    durationMinutes: 15,
    status: "planned",
  }),
  occurrence({
    title: "Physiotherapy",
    start: at("2026-12-04", "11:30"),
    durationMinutes: 90,
    status: "planned",
  }),
  occurrence({
    title: "Medication review",
    start: at("2026-12-05", "14:00"),
    durationMinutes: 30,
    status: "planned",
  }),
];

/** Newest first, as the Task log contract returns it; the planned rows are left out of Log. */
const LOG: Occurrence[] = [
  DESIGN_WEEK[2]!,
  DESIGN_WEEK[1]!,
  DESIGN_WEEK[0]!,
  occurrence({
    title: "Evening medication",
    start: at("2026-11-29", "18:00"),
    status: "done",
    actor: "Aisha Rahman",
  }),
  occurrence({ title: "Weekly weigh-in", start: at("2026-11-29", "09:30"), status: "overdue" }),
  occurrence({
    title: "Physiotherapy",
    start: at("2026-11-28", "11:30"),
    status: "done",
    actor: "Aisha Rahman",
  }),
];

function taskLog(items: Occurrence[]): TaskLogResult {
  return { items, page: 1, pageSize: 20, total: items.length };
}

async function calendarPage(search: Record<string, string> = {}) {
  return FamilyCalendarPage({
    params: Promise.resolve({ clientId: CLIENT_ID }),
    searchParams: Promise.resolve(search),
  });
}

/**
 * The calendar as the person who can tick sees it. Only a carer on shift ticks (carer_only_tick_off),
 * and the carer's page passes `canTick`; the Family page does not, so these tests turn it on here.
 * The tests named for Helen test the tick behaviour of the shared view, not who may tick.
 */
async function renderCalendar(search: Record<string, string> = {}) {
  return render(cloneElement(await calendarPage(search), { canTick: true }));
}

function tasksPanel() {
  return screen.getByRole("region", { name: "Tasks" });
}

function logPanel() {
  return screen.getByRole("region", { name: "Log" });
}

beforeEach(() => {
  mocks.getToday.mockResolvedValue("2026-11-30");
  mocks.getOccurrences.mockResolvedValue(DESIGN_WEEK);
  mocks.getClientShifts.mockResolvedValue([]);
  mocks.getTaskLog.mockResolvedValue(taskLog(LOG));
  mocks.getCurrentUser.mockResolvedValue({ firstName: "Helen", lastName: "Doyle" });
  mocks.setOccurrenceDone.mockResolvedValue({
    ok: true,
    data: { actor: "Helen Doyle", completedAt: "2026-11-30T00:00:00+11:00" },
  });
  mocks.setOccurrenceUndone.mockResolvedValue({ ok: true, data: undefined });
  vi.spyOn(window.history, "replaceState");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("[FAM-UI-02][AC-01] default week", () => {
  it("[FAM-UI-02][AC-01] T-01 given no view param, W is selected and '30 Nov – 6 Dec 2026' is shown", async () => {
    await renderCalendar();

    expect(screen.getByRole("radio", { name: "W" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "D" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("heading", { level: 1, name: "30 Nov – 6 Dec 2026" })).toBeVisible();
    expect(mocks.getOccurrences).toHaveBeenCalledWith(CLIENT_ID, {
      from: "2026-11-30",
      to: "2026-12-06",
    });
  });

  it("[FAM-UI-02][AC-01] opens on the week of whatever day the contract says is today", async () => {
    mocks.getToday.mockResolvedValue("2027-03-10");
    mocks.getOccurrences.mockResolvedValue([]);
    await renderCalendar();

    expect(screen.getByRole("heading", { level: 1, name: "8 Mar – 14 Mar 2027" })).toBeVisible();
    expect(mocks.getOccurrences).toHaveBeenCalledWith(CLIENT_ID, {
      from: "2027-03-08",
      to: "2027-03-14",
    });
  });

  it("[FAM-UI-02][AC-01] a nonsense view or date param falls back to this week", async () => {
    await renderCalendar({ view: "fortnight", date: "yesterday" });

    expect(screen.getByRole("radio", { name: "W" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { level: 1, name: "30 Nov – 6 Dec 2026" })).toBeVisible();
  });
});

describe("[FAM-UI-02][AC-02] week grid", () => {
  it("[FAM-UI-02][AC-02] T-02 Physiotherapy blocks appear at 11:30 on MON 30 and FRI 4", async () => {
    await renderCalendar();

    for (const day of ["2026-11-30", "2026-12-04"]) {
      const column = screen.getByTestId(`week-grid-day-${day}`);
      const block = within(column).getByText("Physiotherapy").closest("button") as HTMLElement;
      expect(block).toHaveTextContent("11:30");
    }
    for (const day of ["2026-12-01", "2026-12-02", "2026-12-03", "2026-12-05", "2026-12-06"]) {
      expect(
        within(screen.getByTestId(`week-grid-day-${day}`)).queryByText("Physiotherapy"),
      ).toBeNull();
    }
  });

  it("[FAM-UI-02][AC-02] every event in the week gets a block on its day", async () => {
    await renderCalendar();

    expect(
      within(screen.getByTestId("week-grid-day-2026-12-02")).getByText("Wound dressing check"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("week-grid-day-2026-12-05")).getByText("Medication review"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-02] clicking a block opens that task's detail", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    const column = screen.getByTestId("week-grid-day-2026-12-04");
    await user.click(within(column).getByText("Physiotherapy"));

    expect(mocks.push).toHaveBeenCalledWith(
      `/family/${CLIENT_ID}/tasks/${encodeURIComponent(DESIGN_WEEK[6]!.key)}?from=calendar&view=week&date=2026-11-30`,
    );
  });

  it("[FAM-UI-07][AC-10] a block carries the calendar's view and selected day, so Task detail's Back returns to them", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "week", date: "2026-12-02" });

    await user.click(screen.getByTestId("week-grid-header-2026-12-03"));
    const column = screen.getByTestId("week-grid-day-2026-12-04");
    await user.click(within(column).getByText("Physiotherapy"));

    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/tasks/${encodeURIComponent(DESIGN_WEEK[6]!.key)}?from=calendar&view=week&date=2026-12-03`,
    );
  });

  it("[FAM-UI-07][AC-10] a Log row carries the calendar's month view, selected day and month", async () => {
    await renderCalendar({ view: "month", date: "2026-11-29", month: "2026-12" });

    const rows = within(logPanel()).getAllByRole("listitem");
    expect(within(rows[0]!).getByRole("link")).toHaveAttribute(
      "href",
      `/family/${CLIENT_ID}/tasks/${encodeURIComponent(DESIGN_WEEK[0]!.key)}?from=calendar&view=month&date=2026-11-29&month=2026-12`,
    );
  });
});

describe("[FAM-UI-02][AC-09] Enter event (CHG-017)", () => {
  const NEW = `/family/${CLIENT_ID}/events/new`;

  it("[FAM-UI-02][AC-09] T-09 the week view's Enter event link opens Add event with the Calendar's origin", async () => {
    await renderCalendar();

    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      `${NEW}?from=calendar&view=week&date=2026-11-30`,
    );
  });

  it("[FAM-UI-02][AC-09] T-09 it carries the day and month views' params", async () => {
    const { unmount } = await renderCalendar({ view: "day", date: "2026-12-02" });
    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      `${NEW}?from=calendar&view=day&date=2026-12-02`,
    );
    unmount();

    await renderCalendar({ view: "month", date: "2026-11-29", month: "2026-12" });
    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      `${NEW}?from=calendar&view=month&date=2026-11-29&month=2026-12`,
    );
  });

  it("[FAM-UI-02][AC-09] T-09 it follows a day picked in the range", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByTestId("week-grid-header-2026-12-03"));

    expect(screen.getByRole("link", { name: "Enter event" })).toHaveAttribute(
      "href",
      `${NEW}?from=calendar&view=week&date=2026-12-03`,
    );
  });

  it("[FAM-17][AC-07] the Family Calendar route has an info tip beside it", async () => {
    await renderCalendar();

    expect(screen.getByRole("button", { name: "About Enter event" })).toBeInTheDocument();
  });

  it("[FAM-UI-02][AC-09] T-09 it sits just before the D/W/M control and is 44px tall", async () => {
    await renderCalendar();

    const link = screen.getByRole("link", { name: "Enter event" });
    const dwm = screen.getByRole("radiogroup");
    expect(link.nextElementSibling).toBe(dwm);
    expect(link).toHaveClass("h-11");
  });
});

describe("[FAM-UI-02][AC-03] Tasks panel", () => {
  it("[FAM-UI-02][AC-03] starts on the selected day (today): 'Monday 30 November' and its three tasks", async () => {
    await renderCalendar();
    const panel = tasksPanel();

    expect(within(panel).getByRole("heading", { name: "Tasks" })).toBeVisible();
    expect(within(panel).getByText("Monday 30 November")).toBeVisible();
    expect(
      within(panel)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")?.textContent),
    ).toEqual(["Morning medication", "Physiotherapy", "Afternoon check-in"]);
  });

  it("[FAM-UI-02][AC-03] T-03 given a user selects TUE 1, the subtitle reads 'Tuesday 1 December'", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByTestId("week-grid-header-2026-12-01"));

    const panel = tasksPanel();
    expect(within(panel).getByText("Tuesday 1 December")).toBeVisible();
    expect(within(panel).getAllByRole("checkbox")).toHaveLength(1);
    expect(within(panel).getByLabelText("Morning medication")).not.toBeChecked();
    // The URL keeps the selection (no server round trip), so a reload lands on the same day.
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      `/family/${CLIENT_ID}/calendar?view=week&date=2026-12-01`,
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-02][AC-03] a day with nothing on it says so", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByTestId("week-grid-header-2026-12-06"));

    const panel = tasksPanel();
    expect(within(panel).getByText("Sunday 6 December")).toBeVisible();
    expect(within(panel).queryAllByRole("checkbox")).toHaveLength(0);
    expect(within(panel).getByText("No tasks on this day")).toBeVisible();
  });

  it("[FAM-UI-02][AC-03] a date param selects that day", async () => {
    await renderCalendar({ view: "week", date: "2026-12-04" });

    expect(within(tasksPanel()).getByText("Friday 4 December")).toBeVisible();
  });
});

describe("[FAM-UI-02][AC-04] ticking a task", () => {
  it("[FAM-UI-02][AC-04] T-04 given Physiotherapy unticked, when ticked, its label is struck through", async () => {
    const user = userEvent.setup();
    await renderCalendar();
    const physio = within(tasksPanel()).getByLabelText("Physiotherapy");
    const label = within(tasksPanel()).getByText("Physiotherapy");

    expect(physio).not.toBeChecked();
    expect(label).not.toHaveClass("line-through");

    await user.click(physio);

    expect(physio).toBeChecked();
    expect(label).toHaveClass("line-through");
  });

  it("[FAM-UI-02][AC-04] a Done task starts ticked and struck through, and can be unticked (OQ-10 default)", async () => {
    const user = userEvent.setup();
    await renderCalendar();
    const morning = within(tasksPanel()).getByLabelText("Morning medication");

    expect(morning).toBeChecked();
    expect(within(tasksPanel()).getByText("Morning medication")).toHaveClass("line-through");

    await user.click(morning);
    expect(morning).not.toBeChecked();
  });

  it("[FAM-UI-02][AC-04] a tick is local: it stays when another day is selected and back again, and nothing is saved", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(within(tasksPanel()).getByLabelText("Physiotherapy"));
    await user.click(screen.getByTestId("week-grid-header-2026-12-01"));
    await user.click(screen.getByTestId("week-grid-header-2026-11-30"));

    expect(within(tasksPanel()).getByLabelText("Physiotherapy")).toBeChecked();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("[FAM-UI-02][AC-08] a tick shows on the grids, with who ticked it (CHG-016)", () => {
  const PHYSIO = "event-physiotherapy:2026-11-30T11:30:00+11:00";
  const MORNING = "event-morning-medication:2026-11-30T09:00:00+11:00";
  const weekBlock = (key: string) => screen.getByTestId(`week-grid-block-${key}`);

  it("[FAM-UI-02][AC-08] ticking Physiotherapy turns its week block from Planned to Done, on the same page", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    expect(weekBlock(PHYSIO)).toHaveTextContent(/^Planned: /);
    await user.click(within(tasksPanel()).getByLabelText("Physiotherapy"));

    expect(weekBlock(PHYSIO)).toHaveTextContent(/^Done: /);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-02][AC-08] the day view shows 'Done · <signed-in name>' for a ticked task", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "day", date: "2026-11-30" });
    const block = screen.getByTestId(`day-timeline-block-${PHYSIO}`);

    expect(block).not.toHaveTextContent("Done");
    await user.click(within(tasksPanel()).getByLabelText("Physiotherapy"));

    expect(block).toHaveTextContent(/^Done: /);
    // jsdom has no layout, so the block is compact; its detail card (opened by
    // keyboard focus, with no delay) shows the full pill with the name.
    act(() => block.focus());
    expect(screen.getByRole("tooltip")).toHaveTextContent("Done · Helen Doyle");
    expect(mocks.getCurrentUser).toHaveBeenCalledWith("family");
  });

  it("[FAM-UI-02][AC-08] the month view's chip turns Done when ticked", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "month", date: "2026-11-30", month: "2026-11" });
    const chip = screen.getByTestId(`month-grid-chip-${PHYSIO}`);

    expect(chip).toHaveTextContent(/^Planned: /);
    await user.click(within(tasksPanel()).getByLabelText("Physiotherapy"));

    expect(chip).toHaveTextContent(/^Done: /);
  });

  it("[FAM-UI-02][AC-08] unticking restores the original status; a task that was Done shows Planned, without its old name", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "day", date: "2026-11-30" });
    const physio = within(tasksPanel()).getByLabelText("Physiotherapy");
    const morningBlock = screen.getByTestId(`day-timeline-block-${MORNING}`);

    await user.click(physio);
    await user.click(physio);
    expect(screen.getByTestId(`day-timeline-block-${PHYSIO}`)).not.toHaveTextContent("Done");

    act(() => morningBlock.focus());
    expect(screen.getByRole("tooltip")).toHaveTextContent("Done · Aisha Rahman");
    await user.click(within(tasksPanel()).getByLabelText("Morning medication"));
    expect(morningBlock).toHaveTextContent(/^Planned: /);
    act(() => morningBlock.focus());
    expect(screen.getByRole("tooltip")).toHaveTextContent("Planned");
    expect(screen.getByRole("tooltip")).not.toHaveTextContent(/Done|Aisha Rahman/);
  });

  it("[FAM-UI-02][AC-08] an Overdue task ticked and unticked is Overdue again", async () => {
    const user = userEvent.setup();
    const overdue = occurrence({
      title: "Weekly weigh-in",
      start: at("2026-11-30", "13:00"),
      durationMinutes: 30,
      status: "overdue",
    });
    mocks.getOccurrences.mockResolvedValue([...DESIGN_WEEK, overdue]);
    await renderCalendar();
    const box = within(tasksPanel()).getByLabelText("Weekly weigh-in");

    expect(weekBlock(overdue.key)).toHaveTextContent(/^Overdue: /);
    await user.click(box);
    expect(weekBlock(overdue.key)).toHaveTextContent(/^Done: /);
    await user.click(box);
    expect(weekBlock(overdue.key)).toHaveTextContent(/^Overdue: /);
  });

  it("[FAM-05][AC-01] ticking saves via setOccurrenceDone; the Log stays as loaded, and the tick survives picking another day", async () => {
    const user = userEvent.setup();
    await renderCalendar();
    const logBefore = logPanel().textContent;

    await user.click(within(tasksPanel()).getByLabelText("Physiotherapy"));
    await user.click(screen.getByTestId("week-grid-header-2026-12-01"));

    expect(weekBlock(PHYSIO)).toHaveTextContent(/^Done: /);
    // The Log isn't refetched from one tick (FAM-05's scope is the save, not a live refresh).
    expect(logPanel().textContent).toBe(logBefore);
    expect(mocks.setOccurrenceDone).toHaveBeenCalledWith(PHYSIO);
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("[FAM-UI-02] Log panel", () => {
  it("[FAM-UI-02] shows 'Log', 'View all' and the three latest done or overdue tasks", async () => {
    await renderCalendar();
    const panel = logPanel();

    expect(within(panel).getByRole("heading", { name: "Log" })).toBeVisible();
    expect(within(panel).getByRole("link", { name: "View all" })).toHaveAttribute(
      "href",
      `/family/${CLIENT_ID}/tasks`,
    );

    const rows = within(panel).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringMatching(/^Morning medicationMon 30 NovDone/),
      expect.stringMatching(/^Evening medicationSun 29 NovDone/),
      expect.stringMatching(/^Weekly weigh-inSun 29 NovOverdue/),
    ]);
    expect(within(rows[0]!).getByRole("link")).toHaveAttribute(
      "href",
      `/family/${CLIENT_ID}/tasks/${encodeURIComponent(DESIGN_WEEK[0]!.key)}?from=calendar&view=week&date=2026-11-30`,
    );
  });

  it("[FAM-UI-02] an empty log says so", async () => {
    mocks.getTaskLog.mockResolvedValue(taskLog([]));
    await renderCalendar();

    expect(within(logPanel()).getByText("No activity yet")).toBeVisible();
  });
});

describe("[FAM-UI-02][AC-05] D / W / M", () => {
  it("[FAM-UI-02][AC-05] pressing M asks for December 2026's month grid", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByRole("radio", { name: "M" }));

    expect(mocks.push).toHaveBeenCalledWith(
      `/family/${CLIENT_ID}/calendar?view=month&date=2026-11-30&month=2026-12`,
    );
  });

  it("[FAM-UI-02][AC-05] the month view shows the December 2026 grid, with the selected day still in it", async () => {
    await renderCalendar({ view: "month", date: "2026-11-30", month: "2026-12" });

    expect(screen.getByRole("radio", { name: "M" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { level: 1, name: "December 2026" })).toBeVisible();
    expect(mocks.getOccurrences).toHaveBeenCalledWith(CLIENT_ID, {
      from: "2026-11-30",
      to: "2027-01-10",
    });
    expect(screen.getByTestId("month-grid-day-2026-12-31")).toHaveAttribute(
      "data-in-month",
      "true",
    );
    expect(screen.getByTestId("month-grid-day-2026-11-30")).toHaveAttribute("aria-pressed", "true");
    expect(within(tasksPanel()).getByText("Monday 30 November")).toBeVisible();
  });

  it("[FAM-UI-02] the day view shows one day and names it", async () => {
    await renderCalendar({ view: "day", date: "2026-12-04" });

    expect(screen.getByRole("radio", { name: "D" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { level: 1, name: "Friday 4 December 2026" })).toBeVisible();
    expect(mocks.getOccurrences).toHaveBeenCalledWith(CLIENT_ID, {
      from: "2026-12-04",
      to: "2026-12-04",
    });
    expect(screen.queryByTestId("week-grid-day-2026-12-04")).toBeNull();
  });

  it("[FAM-UI-02] Previous and Next move a week at a time", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByRole("button", { name: "Next week" }));
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=week&date=2026-12-07`,
    );
    await user.click(screen.getByRole("button", { name: "Previous week" }));
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=week&date=2026-11-23`,
    );
  });
});

describe("[FAM-UI-02][AC-06] keyboard shortcuts", () => {
  it("[FAM-UI-02][AC-06] D and M switch the view from the week view", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.keyboard("d");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=day&date=2026-11-30`,
    );
    await user.keyboard("m");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=month&date=2026-11-30&month=2026-12`,
    );
  });

  it("[FAM-UI-02][AC-06] W switches to the week view, upper or lower case", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "day", date: "2026-12-04" });

    await user.keyboard("W");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=week&date=2026-12-04`,
    );
  });

  it("[FAM-UI-02][AC-06] the view already shown is not pushed again", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.keyboard("w");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-02][AC-06] the arrow keys move a week in the week view", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.keyboard("{ArrowRight}");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=week&date=2026-12-07`,
    );
    await user.keyboard("{ArrowLeft}");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=week&date=2026-11-23`,
    );
  });

  it("[FAM-UI-02][AC-06] the arrow keys move a day in the day view", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "day", date: "2026-12-04" });

    await user.keyboard("{ArrowRight}");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=day&date=2026-12-05`,
    );
  });

  it("[FAM-UI-02][AC-06] the arrow keys move a month in the month view", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "month", date: "2026-12-15", month: "2026-12" });

    await user.keyboard("{ArrowRight}");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=month&date=2027-01-01&month=2027-01`,
    );
  });

  it("[FAM-UI-02][AC-06] steps from the day picked on screen, not the one first loaded", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByTestId("week-grid-header-2026-12-03"));
    await user.keyboard("d");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=day&date=2026-12-03`,
    );
  });

  it("[FAM-UI-02][AC-06] shortcuts are ignored with Ctrl, Cmd or Alt held", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.keyboard("{Control>}d{/Control}{Meta>}{ArrowRight}{/Meta}{Alt>}m{/Alt}");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-02][AC-06] shortcuts are ignored while typing in a text field", async () => {
    const user = userEvent.setup();
    await renderCalendar();
    const field = document.createElement("input");
    document.body.append(field);

    await user.click(field);
    await user.keyboard("dwmt{ArrowRight}");
    expect(mocks.push).not.toHaveBeenCalled();
    field.remove();
  });

  it("[FAM-UI-02][AC-06] the arrows, Today and the view options name their shortcut keys", async () => {
    await renderCalendar();

    expect(screen.getByRole("button", { name: "Previous week" })).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowLeft",
    );
    expect(screen.getByRole("button", { name: "Next week" })).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowRight",
    );
    expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute("aria-keyshortcuts", "T");
  });
});

describe("[FAM-UI-02][AC-07] Today", () => {
  it("[FAM-UI-02][AC-07] the Today button brings the week view back to today's week", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "week", date: "2027-02-10" });

    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=week&date=2026-11-30`,
    );
  });

  it("[FAM-UI-02][AC-07] T brings the day view back to today", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "day", date: "2027-02-10" });

    await user.keyboard("t");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=day&date=2026-11-30`,
    );
  });

  it("[FAM-UI-02][AC-07] T brings the month view back to the month today is in", async () => {
    const user = userEvent.setup();
    await renderCalendar({ view: "month", date: "2027-02-10", month: "2027-02" });

    await user.keyboard("T");
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/family/${CLIENT_ID}/calendar?view=month&date=2026-11-30&month=2026-11`,
    );
  });

  it("[FAM-UI-02][AC-07] on today already, Today reselects today without a navigation", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByTestId("week-grid-header-2026-12-03"));
    await user.keyboard("t");
    expect(mocks.push).not.toHaveBeenCalled();
    expect(within(tasksPanel()).getByText("Monday 30 November")).toBeVisible();
  });
});

describe("[FAM-UI-02] states", () => {
  it("[FAM-UI-02] loading shows a skeleton with a status role", () => {
    render(<CalendarLoading />);
    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
  });

  it("[FAM-UI-02] a failed read rejects, so the route's error boundary shows", async () => {
    mocks.getOccurrences.mockRejectedValue(new Error("boom"));
    await expect(renderCalendar()).rejects.toThrow("boom");
  });

  it("[FAM-UI-02] the error state offers Retry", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<CalendarError error={new Error("x")} retry={retry} />);

    expect(screen.getByText("Something went wrong")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("[FAM-UI-02] an empty week still draws the grid, and the Tasks panel says there is nothing", async () => {
    mocks.getOccurrences.mockResolvedValue([]);
    await renderCalendar();

    expect(screen.getByTestId("week-grid-day-2026-11-30")).toBeInTheDocument();
    expect(within(tasksPanel()).getByText("No tasks on this day")).toBeVisible();
  });

  it("[FAM-UI-02] a very long title wraps in the Tasks panel instead of breaking the layout", async () => {
    const long =
      "Administer prescribed eye drops to both eyes, check for redness or discharge, and record it in the log";
    mocks.getOccurrences.mockResolvedValue([
      occurrence({ title: long, start: at("2026-11-30", "16:30"), status: "planned" }),
    ]);
    await renderCalendar();

    // The kit's checklist rows take no class, so the list sets wrapping for its labels.
    const list = within(tasksPanel()).getByText(long).closest("ul") as HTMLElement;
    expect(list.className).toContain("[overflow-wrap:anywhere]");
  });
});

describe("[FAM-UI-02] accessibility", () => {
  it("[FAM-UI-02] the week view has no axe violations", async () => {
    const { container } = await renderCalendar();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-02] the month view has no axe violations", async () => {
    const { container } = await renderCalendar({ view: "month" });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[FAM-05][AC-01] ticking saves", () => {
  const PHYSIO = "event-physiotherapy:2026-11-30T11:30:00+11:00";

  it("[FAM-05][AC-01] T-01 given Physiotherapy is Planned, when Helen ticks it, it shows struck through and setOccurrenceDone is called with its key", async () => {
    const user = userEvent.setup();
    await renderCalendar();
    const box = within(tasksPanel()).getByLabelText("Physiotherapy");
    expect(box).not.toBeChecked();

    await user.click(box);

    expect(box).toBeChecked();
    expect(mocks.setOccurrenceDone).toHaveBeenCalledWith(PHYSIO);
    expect(mocks.setOccurrenceDone).toHaveBeenCalledOnce();
  });

  it("[FAM-05][AC-01] unticking a Done task calls setOccurrenceUndone with its key", async () => {
    const user = userEvent.setup();
    await renderCalendar();
    const box = within(tasksPanel()).getByLabelText("Morning medication");
    expect(box).toBeChecked();

    await user.click(box);

    expect(box).not.toBeChecked();
    expect(mocks.setOccurrenceUndone).toHaveBeenCalledWith(
      "event-morning-medication:2026-11-30T09:00:00+11:00",
    );
  });
});

describe("[FAM-05][AC-02] a failed save reverts the tick", () => {
  const PHYSIO = "event-physiotherapy:2026-11-30T11:30:00+11:00";

  it("[FAM-05][AC-02] T-02 given the save fails, when Helen ticks a task, the checkbox returns to unticked and an error is shown", async () => {
    mocks.setOccurrenceDone.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save. Please try again." },
    });
    const user = userEvent.setup();
    await renderCalendar();
    const box = within(tasksPanel()).getByLabelText("Physiotherapy");

    await user.click(box);

    // The mocked action settles within the same click, so by here the optimistic tick has
    // already reverted; a real, slower request would show it briefly first.
    await screen.findByText("Couldn't save. Please try again.");
    expect(box).not.toBeChecked();
    expect(mocks.setOccurrenceDone).toHaveBeenCalledWith(PHYSIO);
  });

  it("[FAM-05][AC-02] a failed undo reverts the checkbox back to checked, with an error shown", async () => {
    mocks.setOccurrenceUndone.mockResolvedValue({
      ok: false,
      error: { code: "NOT_ALLOWED", message: "Not permitted to undo this task." },
    });
    const user = userEvent.setup();
    await renderCalendar();
    const box = within(tasksPanel()).getByLabelText("Morning medication");

    await user.click(box);

    await screen.findByText("Not permitted to undo this task.");
    expect(box).toBeChecked();
  });

  it("[FAM-05][AC-02] a new tick clears the previous attempt's error", async () => {
    mocks.setOccurrenceDone.mockResolvedValueOnce({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save. Please try again." },
    });
    const user = userEvent.setup();
    await renderCalendar();
    const physio = within(tasksPanel()).getByLabelText("Physiotherapy");
    await user.click(physio);
    await screen.findByText("Couldn't save. Please try again.");

    await user.click(within(tasksPanel()).getByLabelText("Afternoon check-in"));

    expect(screen.queryByText("Couldn't save. Please try again.")).not.toBeInTheDocument();
  });
});

describe("[FAM-05][AC-03] Tasks panel subtitle and listing", () => {
  it("[FAM-05][AC-03] T-03 given the selected date is Monday 30 November, the subtitle reads 'Monday 30 November' and lists that day's occurrences", async () => {
    await renderCalendar();
    const panel = tasksPanel();

    expect(within(panel).getByText("Monday 30 November")).toBeVisible();
    expect(
      within(panel)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")?.textContent),
    ).toEqual(["Morning medication", "Physiotherapy", "Afternoon check-in"]);
  });
});

describe("[FAM-05][AC-04] Log panel listing", () => {
  it("[FAM-05][AC-04] T-04 given seed data, the Log panel lists Morning medication (Done · Aisha Rahman), Evening medication (Done · Aisha Rahman) and Weekly weigh-in (Overdue)", async () => {
    await renderCalendar();
    const rows = within(logPanel()).getAllByRole("listitem");

    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringMatching(/^Morning medication.*Done · Aisha Rahman$/),
      expect.stringMatching(/^Evening medication.*Done · Aisha Rahman$/),
      expect.stringMatching(/^Weekly weigh-in.*Overdue$/),
    ]);
  });
});

describe("who is caring, on the grids", () => {
  it("draws each carer's shift as a block beside the events, and not as a task", async () => {
    mocks.getClientShifts.mockResolvedValue([
      {
        id: "shift-1",
        carerName: "Aisha Rahman",
        start: at("2026-11-30", "08:00"),
        end: at("2026-11-30", "12:00"),
      },
    ]);
    await renderCalendar();

    expect(screen.getAllByText(/Aisha Rahman on duty/).length).toBeGreaterThan(0);
    expect(within(tasksPanel()).queryByText(/on duty/)).not.toBeInTheDocument();
  });
});

describe("only the carer on shift ticks", () => {
  it("the Family calendar has no tick boxes and still lists each task with its status", async () => {
    render(await calendarPage());

    expect(within(tasksPanel()).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(tasksPanel()).getByText("Physiotherapy")).toBeInTheDocument();
  });
});
