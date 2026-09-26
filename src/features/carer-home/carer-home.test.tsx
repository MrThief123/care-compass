import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Loading from "@/app/(carer)/carer/home/loading";
import CarerHomePage from "@/app/(carer)/carer/home/page";
import CarerLayout from "@/app/(carer)/carer/layout";
import type { CarerNotification } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getCurrentUser: vi.fn(),
  getToday: vi.fn(),
  getCarerShifts: vi.fn(),
  getCarerNotifications: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
  usePathname: () => "/carer/home",
}));
vi.mock("@/server/auth/queries", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/server/auth/actions", () => ({
  signOut: vi.fn(),
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
 * The screen reads only through the `src/server/**` contract, so these tests
 * replace that contract with fixtures shaped like CHG-025's Carer Home:
 * today's shifts in the 'Shifts' calendar (Day view by default, CHG-031),
 * shift notifications beside it, no Tasks card. The calendar's D/W/M views
 * are tested in `carer-home-calendar.test.tsx`. The contract's own tests run
 * against `src/mocks`.
 */
const CARER_ID = "staff-aisha";

const AISHA = {
  profileId: CARER_ID,
  role: "carer",
  organisationId: "org-banksia",
  firstName: "Aisha",
  lastName: "Rahman",
};

const MARGARET_SHIFT = {
  id: "shift-aisha-margaret-1",
  carerId: CARER_ID,
  clientId: "client-margaret",
  clientFirstName: "Margaret",
  start: "2026-11-30T08:00:00+11:00",
  end: "2026-11-30T12:00:00+11:00",
};

function notification(
  fields: Pick<CarerNotification, "id" | "message" | "createdAt"> & Partial<CarerNotification>,
): CarerNotification {
  return { carerId: CARER_ID, source: "admin", read: false, ...fields };
}

const NOTIFICATIONS: CarerNotification[] = [
  notification({
    id: "notif-1",
    message: "New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).",
    createdAt: "2026-11-30T08:30:00+11:00",
  }),
  notification({
    id: "notif-2",
    message: "Shift changed: Wednesday 2 Dec now 13:00–17:00 (Margaret).",
    createdAt: "2026-11-29T17:00:00+11:00",
  }),
  notification({
    id: "notif-3",
    message: "Shift cancelled: Friday 4 Dec, 08:00–12:00 (Margaret).",
    createdAt: "2026-11-28T10:00:00+11:00",
    read: true,
  }),
];

function captureErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

async function renderHome() {
  const page = await CarerHomePage({ searchParams: Promise.resolve({}) });
  return render(page);
}

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue(AISHA);
  mocks.getToday.mockResolvedValue("2026-11-30");
  mocks.getCarerShifts.mockResolvedValue([MARGARET_SHIFT]);
  mocks.getCarerNotifications.mockResolvedValue(NOTIFICATIONS);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("[CAR-UI-01] Carer Home", () => {
  it("[CAR-UI-01][AC-01] Shifts (Day view, today) shows one timeline block, 08:00–12:00 Margaret, with no status pill or event title", async () => {
    await renderHome();
    const calendar = screen.getByRole("region", { name: "Shifts" });
    const blocks = within(calendar).getAllByTestId(/^day-timeline-block-/);

    expect(blocks).toHaveLength(1);
    expect(within(blocks[0]!).getByText("08:00–12:00")).toBeInTheDocument();
    expect(within(blocks[0]!).getByText("Margaret")).toBeInTheDocument();
    expect(within(calendar).queryByText(/Done|Planned|Overdue/)).not.toBeInTheDocument();
    expect(
      within(calendar).queryByText(/medication|Physiotherapy|check-in/i),
    ).not.toBeInTheDocument();
    expect(mocks.getCurrentUser).toHaveBeenCalledWith("carer");
    expect(mocks.getCarerShifts).toHaveBeenCalledWith(CARER_ID, {
      from: "2026-11-30",
      to: "2026-11-30",
    });
  });

  it("[CAR-UI-01][AC-02] Notifications include 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' with an 'Admin' chip", async () => {
    await renderHome();
    const notifications = screen.getByRole("region", { name: "Notifications" });
    const message = within(notifications).getByText(
      "New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).",
    );
    const row = message.closest("li") ?? message.parentElement!;

    expect(within(row).getByText("Admin")).toBeInTheDocument();
    expect(mocks.getCarerNotifications).toHaveBeenCalledWith(CARER_ID);
  });

  it("[CAR-UI-01][AC-03] the Carer header has a bell button", async () => {
    const layout = await CarerLayout({ children: <div /> });
    render(layout);

    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });

  it("[CAR-UI-01][AC-04] there is no Tasks card and no checkbox", async () => {
    await renderHome();

    expect(screen.queryByRole("region", { name: "Tasks" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tasks" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("[CAR-UI-01][AC-05] Notifications sits beside Shifts in the same row, calendar first", async () => {
    await renderHome();
    const calendar = screen.getByRole("region", { name: "Shifts" });
    const notifications = screen.getByRole("region", { name: "Notifications" });

    expect(calendar.parentElement).toBe(notifications.parentElement);
    expect(
      calendar.compareDocumentPosition(notifications) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("[CAR-UI-01][AC-06] every notification has the Admin chip, newest first, and no Family chip appears", async () => {
    await renderHome();
    const notifications = screen.getByRole("region", { name: "Notifications" });
    const rows = within(notifications).getAllByRole("listitem");

    expect(rows).toHaveLength(3);
    rows.forEach((row) => expect(within(row).getByText("Admin")).toBeInTheDocument());
    expect(within(notifications).queryByText("Family")).not.toBeInTheDocument();
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("New shift assigned"),
      expect.stringContaining("Shift changed"),
      expect.stringContaining("Shift cancelled"),
    ]);
  });
});

describe("[CAR-UI-01] Carer Home empty, error and loading states", () => {
  it("[CAR-UI-01][AC-07] Shifts shows 'No shifts' when the carer has no shifts today", async () => {
    mocks.getCarerShifts.mockResolvedValue([]);
    await renderHome();
    const calendar = screen.getByRole("region", { name: "Shifts" });

    expect(within(calendar).getByText("No shifts")).toBeInTheDocument();
    expect(within(calendar).queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("[CAR-UI-01][AC-07] Notifications shows 'No notifications' when there are none", async () => {
    mocks.getCarerNotifications.mockResolvedValue([]);
    await renderHome();
    const notifications = screen.getByRole("region", { name: "Notifications" });

    expect(within(notifications).getByText("No notifications")).toBeInTheDocument();
    expect(within(notifications).queryByRole("listitem")).not.toBeInTheDocument();
  });

  it.each([
    ["shifts", () => mocks.getCarerShifts.mockRejectedValue(new Error("Margaret Doyle secret"))],
    [
      "notifications",
      () => mocks.getCarerNotifications.mockRejectedValue(new Error("Margaret Doyle secret")),
    ],
  ])(
    "[CAR-UI-01][AC-08] a rejected %s query shows the error state, Try again refreshes, and no message is logged",
    async (_name, rejectIt) => {
      const errorLog = captureErrorLog();
      rejectIt();
      await renderHome();

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Shifts" })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(mocks.refresh).toHaveBeenCalledTimes(1);

      const logged = errorLog.mock.calls.flat().map(String).join(" ");
      expect(logged).not.toContain("Margaret Doyle secret");
    },
  );

  it("[CAR-UI-01][AC-09] loading skeleton announces itself as loading and holds no data", () => {
    render(<Loading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByText("Margaret")).not.toBeInTheDocument();
  });
});

describe("[CAR-UI-01] Carer Home accessibility (REQ-N2)", () => {
  it("[CAR-UI-01][AC-10] populated screen has no axe violations", async () => {
    const { container } = await renderHome();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-01][AC-10] empty screen has no axe violations", async () => {
    mocks.getCarerShifts.mockResolvedValue([]);
    mocks.getCarerNotifications.mockResolvedValue([]);
    const { container } = await renderHome();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-01][AC-10] error state has no axe violations", async () => {
    captureErrorLog();
    mocks.getCarerShifts.mockRejectedValue(new Error("x"));
    const { container } = await renderHome();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-01][AC-10] loading skeleton has no axe violations", async () => {
    const { container } = render(<Loading />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
