import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadAdminClientCalendar } from "@/features/admin-client-view/load-calendar";
import type { AnyOccurrence, Occurrence, PlainEventOccurrence } from "@/types/domain";

import { FamilyCalendarView } from "./family-calendar-view";
import { loadFamilyCalendar } from "./load-calendar";

/*
 * A plain event (task switch off, `automatic`) saved from Add event was written to the database
 * but never drawn: the calendar loaders read tasks only, the contract's default. These pin that
 * every calendar (Family, Carer, Admin) asks for tasks and plain events together.
 */

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getToday: vi.fn(),
  getOccurrences: vi.fn(),
  getClientShifts: vi.fn(),
  getTaskLog: vi.fn(),
  getCurrentUser: vi.fn(),
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
  setOccurrenceDone: vi.fn(),
  setOccurrenceUndone: vi.fn(),
}));

const CLIENT_ID = "client-margaret";
const at = (date: string, time: string) => `${date}T${time}:00+11:00`;

const TASK: Occurrence = {
  key: `event-meds:${at("2026-11-30", "09:00")}`,
  eventId: "event-meds",
  clientId: CLIENT_ID,
  title: "Morning medication",
  description: "",
  start: at("2026-11-30", "09:00"),
  durationMinutes: 30,
  status: "planned",
};

const WALK: PlainEventOccurrence = {
  key: `event-walk:${at("2026-11-30", "14:00")}`,
  eventId: "event-walk",
  clientId: CLIENT_ID,
  title: "Afternoon walk",
  description: "",
  start: at("2026-11-30", "14:00"),
  durationMinutes: 45,
  kind: "event",
};

beforeEach(() => {
  mocks.getToday.mockResolvedValue("2026-11-30");
  mocks.getOccurrences.mockResolvedValue([TASK, WALK]);
  mocks.getClientShifts.mockResolvedValue([]);
  mocks.getTaskLog.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
  mocks.getCurrentUser.mockResolvedValue({ firstName: "Helen", lastName: "Doyle" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("[UI-05][AC-07] every calendar reads plain events as well as tasks", () => {
  it.each(["family", "carer"] as const)(
    "[UI-05][AC-07] the %s calendar asks the contract for tasks and plain events",
    async (role) => {
      const data = await loadFamilyCalendar(CLIENT_ID, {}, role);

      expect(mocks.getOccurrences).toHaveBeenCalledWith(
        CLIENT_ID,
        { from: "2026-11-30", to: "2026-12-06" },
        { type: "all" },
      );
      expect(data.occurrences).toEqual([TASK, WALK]);
    },
  );

  it("[UI-05][AC-07] the admin client calendar asks the contract for tasks and plain events", async () => {
    const data = await loadAdminClientCalendar(CLIENT_ID, {});

    expect(mocks.getOccurrences).toHaveBeenCalledWith(
      CLIENT_ID,
      { from: "2026-11-30", to: "2026-12-06" },
      { type: "all" },
    );
    expect(data.occurrences).toEqual([TASK, WALK]);
  });
});

describe("[UI-05][AC-07] the calendar draws a plain event", () => {
  function renderView(occurrences: AnyOccurrence[]) {
    return render(
      <FamilyCalendarView
        clientId={CLIENT_ID}
        today="2026-11-30"
        params={{ view: "week", date: "2026-11-30", month: "2026-11" }}
        occurrences={occurrences}
        log={[]}
        actorName="Helen Doyle"
        canTick
      />,
    );
  }

  it("[UI-05][AC-07] a plain event gets a block on its day in the week grid, labelled Event", () => {
    renderView([TASK, WALK]);

    const column = screen.getByTestId("week-grid-day-2026-11-30");
    const block = within(column).getByText("Afternoon walk").closest("button") as HTMLElement;
    expect(block).toHaveTextContent("14:00");
    expect(block).toHaveTextContent(/Event/);
  });

  it("[UI-05][AC-07] the Tasks panel lists only tasks: a plain event has no tick box", () => {
    renderView([TASK, WALK]);

    const panel = screen.getByRole("region", { name: "Tasks" });
    expect(
      within(panel)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")?.textContent),
    ).toEqual(["Morning medication"]);
    expect(within(panel).queryByText("Afternoon walk")).toBeNull();
  });

  it("[UI-05][AC-07] clicking a plain event's block opens its detail", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    renderView([TASK, WALK]);

    await user.click(
      within(screen.getByTestId("week-grid-day-2026-11-30")).getByText("Afternoon walk"),
    );

    expect(mocks.push).toHaveBeenCalledWith(
      expect.stringContaining(`/family/${CLIENT_ID}/tasks/${encodeURIComponent(WALK.key)}`),
    );
  });
});
