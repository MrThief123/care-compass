import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CarerHomePage from "@/app/(carer)/carer/home/page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  getCurrentUser: vi.fn(),
  getToday: vi.fn(),
  getCarerShifts: vi.fn(),
  getCarerNotifications: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: mocks.refresh }),
  usePathname: () => "/carer/home",
}));
vi.mock("@/server/auth/queries", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/server/events/queries", () => ({
  getToday: mocks.getToday,
}));
vi.mock("@/server/shifts/queries", () => ({
  getCarerShifts: mocks.getCarerShifts,
}));
vi.mock("@/server/notifications/queries", () => ({
  getCarerNotifications: mocks.getCarerNotifications,
}));

/*
 * Carer Home's 'Shifts' calendar in D/W/M (CHG-031: the Carer Calendar screen
 * was merged into Home; Home opens on Day). The screen reads only through the
 * `src/server/**` contract, so these tests replace that contract with rows
 * shaped like `SHIFTS` (CHG-025, CHG-030):
 * Aisha's three shifts with Margaret in the week of Mon 30 Nov 2026. The
 * contract's own tests (`src/server/shifts/queries.test.ts`) run against
 * `src/mocks`.
 */
const CARER_ID = "staff-aisha";
const CLIENT_ID = "client-margaret";

const AISHA = {
  profileId: CARER_ID,
  role: "carer",
  organisationId: "org-banksia",
  firstName: "Aisha",
  lastName: "Rahman",
};

function shift(id: string, start: string, end: string) {
  return { id, carerId: CARER_ID, clientId: CLIENT_ID, clientFirstName: "Margaret", start, end };
}

const MON = shift(
  "shift-aisha-margaret-1",
  "2026-11-30T08:00:00+11:00",
  "2026-11-30T12:00:00+11:00",
);
const TUE = shift(
  "shift-aisha-margaret-2",
  "2026-12-01T09:00:00+11:00",
  "2026-12-01T11:00:00+11:00",
);
const WED = shift(
  "shift-aisha-margaret-3",
  "2026-12-02T13:00:00+11:00",
  "2026-12-02T17:00:00+11:00",
);
const WEEK = [MON, TUE, WED];

/** Renders Carer Home; Week unless the test passes its own params. */
async function renderCalendar(search: Record<string, string> = { view: "week" }) {
  const ui = await CarerHomePage({ searchParams: Promise.resolve(search) });
  return render(ui);
}

function blocksOn(date: string) {
  return within(screen.getByTestId(`week-grid-day-${date}`)).queryAllByTestId(/^week-grid-block-/);
}

function captureErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue(AISHA);
  mocks.getToday.mockResolvedValue("2026-11-30");
  mocks.getCarerShifts.mockResolvedValue(WEEK);
  mocks.getCarerNotifications.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("[CAR-UI-03] Carer Home week of shifts", () => {
  it("[CAR-UI-03][AC-01] MON 30, TUE 1 and WED 2 each show one 'Margaret' shift block with its time range", async () => {
    await renderCalendar();

    const expected: [string, string][] = [
      ["2026-11-30", "08:00–12:00"],
      ["2026-12-01", "09:00–11:00"],
      ["2026-12-02", "13:00–17:00"],
    ];
    for (const [date, range] of expected) {
      const blocks = blocksOn(date);
      expect(blocks).toHaveLength(1);
      expect(within(blocks[0]!).getByText("Margaret")).toBeInTheDocument();
      expect(within(blocks[0]!).getByText(range)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId(/^week-grid-block-/)).toHaveLength(3);
  });

  it("[CAR-UI-03][AC-01] blocks carry no status word and no event title", async () => {
    await renderCalendar();

    expect(screen.queryByText(/Done|Planned|Overdue/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/medication|Physiotherapy|Afternoon|Wound|Weekly/i),
    ).not.toBeInTheDocument();
  });

  it("[CAR-UI-03][AC-02] there is no 'Tasks for the selected shift' panel and no checkbox", async () => {
    await renderCalendar();

    expect(screen.queryByText(/Tasks for the selected shift/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("[CAR-UI-03][AC-03] with no view param, D is selected, 'Shifts' shows and only today is read", async () => {
    mocks.getCarerShifts.mockResolvedValue([MON]);
    await renderCalendar({});

    expect(screen.getByRole("heading", { name: "Shifts" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "D" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "W" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "M" })).toHaveAttribute("aria-checked", "false");
    expect(mocks.getCurrentUser).toHaveBeenCalledWith("carer");
    expect(mocks.getCarerShifts).toHaveBeenCalledWith(CARER_ID, {
      from: "2026-11-30",
      to: "2026-11-30",
    });
  });

  it("[CAR-UI-03][AC-03] view=week reads today's week and selects W", async () => {
    await renderCalendar({ view: "week" });

    expect(screen.getByRole("radio", { name: "W" })).toHaveAttribute("aria-checked", "true");
    expect(mocks.getCarerShifts).toHaveBeenCalledWith(CARER_ID, {
      from: "2026-11-30",
      to: "2026-12-06",
    });
  });

  it("[CAR-UI-03][AC-04] clicking a week shift block opens that patient's page", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(blocksOn("2026-12-01")[0]!);

    expect(mocks.push).toHaveBeenCalledWith(`/carer/patients/${CLIENT_ID}`);
  });

  it("[CAR-UI-03][AC-04] clicking a day shift block opens that patient's page", async () => {
    const user = userEvent.setup();
    mocks.getCarerShifts.mockResolvedValue([MON]);
    await renderCalendar({});

    await user.click(screen.getAllByTestId(/^day-timeline-block-/)[0]!);

    expect(mocks.push).toHaveBeenCalledWith(`/carer/patients/${CLIENT_ID}`);
  });
});

describe("[CAR-UI-03][AC-05] Day and Month views", () => {
  it("[CAR-UI-03][AC-05] view=day&date=2026-12-01 selects D and shows the one Tue shift", async () => {
    mocks.getCarerShifts.mockResolvedValue([TUE]);
    await renderCalendar({ view: "day", date: "2026-12-01" });

    expect(screen.getByRole("radio", { name: "D" })).toHaveAttribute("aria-checked", "true");
    expect(mocks.getCarerShifts).toHaveBeenCalledWith(CARER_ID, {
      from: "2026-12-01",
      to: "2026-12-01",
    });
    const blocks = screen.getAllByTestId(/^day-timeline-block-/);
    expect(blocks).toHaveLength(1);
    expect(within(blocks[0]!).getByText("Margaret")).toBeInTheDocument();
    expect(within(blocks[0]!).getByText("09:00–11:00")).toBeInTheDocument();
  });

  it("[CAR-UI-03][AC-05] view=month&month=2026-12 selects M and shows a Margaret chip on 30 Nov, 1 Dec and 2 Dec", async () => {
    await renderCalendar({ view: "month", date: "2026-11-30", month: "2026-12" });

    expect(screen.getByRole("radio", { name: "M" })).toHaveAttribute("aria-checked", "true");
    expect(mocks.getCarerShifts).toHaveBeenCalledWith(
      CARER_ID,
      expect.objectContaining({ from: "2026-11-30" }),
    );
    for (const date of ["2026-11-30", "2026-12-01", "2026-12-02"]) {
      expect(
        within(screen.getByTestId(`month-grid-day-${date}`)).getByText(/Margaret/),
      ).toBeInTheDocument();
    }
  });
});

describe("[CAR-UI-03][AC-06] navigation writes the URL", () => {
  it("[CAR-UI-03][AC-06] Next week goes to the week of 7 Dec", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByRole("button", { name: /Next week/ }));

    expect(mocks.push).toHaveBeenCalledWith("/carer/home?view=week&date=2026-12-07");
  });

  it("[CAR-UI-03][AC-06] Previous week goes to the week of 23 Nov", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByRole("button", { name: /Previous week/ }));

    expect(mocks.push).toHaveBeenCalledWith("/carer/home?view=week&date=2026-11-23");
  });

  it("[CAR-UI-03][AC-06] Today returns to today's week", async () => {
    const user = userEvent.setup();
    mocks.getCarerShifts.mockResolvedValue([]);
    await renderCalendar({ view: "week", date: "2026-12-09" });

    await user.click(screen.getByRole("button", { name: /Today/ }));

    expect(mocks.push).toHaveBeenCalledWith("/carer/home?view=week&date=2026-11-30");
  });

  it("[CAR-UI-03][AC-06] Next day from today's Day view goes to 1 Dec", async () => {
    const user = userEvent.setup();
    await renderCalendar({});

    await user.click(screen.getByRole("button", { name: /Next day/ }));

    expect(mocks.push).toHaveBeenCalledWith("/carer/home?view=day&date=2026-12-01");
  });

  it("[CAR-UI-03][AC-06] pressing M opens December 2026's month", async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByRole("radio", { name: "M" }));

    expect(mocks.push).toHaveBeenCalledWith(
      "/carer/home?view=month&date=2026-11-30&month=2026-12",
    );
  });
});

describe("[CAR-UI-03] Carer Home calendar empty and error states", () => {
  it("[CAR-UI-03][AC-08] no shifts in range shows 'No shifts', with D/W/M and the arrows still there", async () => {
    mocks.getCarerShifts.mockResolvedValue([]);
    await renderCalendar();

    expect(screen.getByText("No shifts")).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^week-grid-block-/)).toHaveLength(0);
    expect(screen.getByRole("radiogroup", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Previous week/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next week/ })).toBeInTheDocument();
  });

  it.each([
    ["shifts", () => mocks.getCarerShifts.mockRejectedValue(new Error("Margaret Doyle secret"))],
    ["today", () => mocks.getToday.mockRejectedValue(new Error("Margaret Doyle secret"))],
  ])(
    "[CAR-UI-03][AC-09] a rejected %s query shows the error state, Try again refreshes, and no message is logged",
    async (_name, rejectIt) => {
      const errorLog = captureErrorLog();
      rejectIt();
      await renderCalendar();

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.queryByRole("radiogroup", { name: "View" })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(mocks.refresh).toHaveBeenCalledTimes(1);

      const logged = errorLog.mock.calls.flat().map(String).join(" ");
      expect(logged).not.toContain("Margaret Doyle secret");
    },
  );
});

describe("[CAR-UI-03] Carer Home calendar accessibility (REQ-N2)", () => {
  it("[CAR-UI-03][AC-10] populated screen has no axe violations", async () => {
    const { container } = await renderCalendar();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-03][AC-10] empty screen has no axe violations", async () => {
    mocks.getCarerShifts.mockResolvedValue([]);
    const { container } = await renderCalendar();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-03][AC-10] error state has no axe violations", async () => {
    captureErrorLog();
    mocks.getCarerShifts.mockRejectedValue(new Error("x"));
    const { container } = await renderCalendar();

    expect(await axe(container)).toHaveNoViolations();
  });
});
