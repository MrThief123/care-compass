import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FamilyHomePage from "@/app/(family)/family/[clientId]/home/page";
import { layoutDay } from "@/features/family-home/today-layout";
import type { Occurrence } from "@/types/domain";

/*
 * FAM-01. The Today panel itself is FAM-UI-01's; these tests pin what FAM-01 promises about it
 * against the contract: the blocks for the design's day (AC-01 to AC-04, AC-06) and that the page
 * checks the user may open the client before it reads anything (AC-05, DECISIONS FD-05).
 */
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  assertClientAccess: vi.fn(),
  getTodayOccurrences: vi.fn(),
  getTaskLog: vi.fn(),
  getBudgetSummary: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
}));
vi.mock("@/server/clients/queries", () => ({ assertClientAccess: mocks.assertClientAccess }));
vi.mock("@/server/events/queries", () => ({
  getTodayOccurrences: mocks.getTodayOccurrences,
  getTaskLog: mocks.getTaskLog,
}));
vi.mock("@/server/budget/queries", () => ({ getBudgetSummary: mocks.getBudgetSummary }));

const CLIENT_ID = "client-margaret";
const OTHER_CLIENT_ID = "client-robert";

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

const MORNING_MEDS = occurrence({
  title: "Morning medication",
  start: "2026-11-30T09:00:00+11:00",
  durationMinutes: 60,
  status: "done",
  actor: "Aisha Rahman",
  assignee: "Aisha Rahman",
});
const PHYSIOTHERAPY = occurrence({
  title: "Physiotherapy",
  start: "2026-11-30T11:30:00+11:00",
  durationMinutes: 90,
  status: "planned",
  assignee: "Aisha Rahman",
});

/** A redirect as Next throws it. */
function redirectError(to: string) {
  return Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${to};307;` });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-30T08:00:00+11:00"));
  mocks.assertClientAccess.mockResolvedValue(undefined);
  mocks.getTodayOccurrences.mockResolvedValue([MORNING_MEDS, PHYSIOTHERAPY]);
  mocks.getTaskLog.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
  mocks.getBudgetSummary.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

async function renderHome(clientId = CLIENT_ID) {
  const page = await FamilyHomePage({ params: Promise.resolve({ clientId }) });
  return render(page);
}

describe("[FAM-01] Today panel blocks", () => {
  it("[FAM-01][AC-01] Morning medication at 09:00 shows its name, carer, '1 hr' and 'Done · Aisha Rahman'", async () => {
    await renderHome();
    const today = screen.getByRole("region", { name: "Today" });

    const block = within(today).getByRole("link", { name: /Morning medication/ });
    expect(within(block).getByText("Morning medication")).toBeInTheDocument();
    expect(within(block).getByText("1 hr")).toBeInTheDocument();
    expect(within(block).getByText("Done · Aisha Rahman")).toBeInTheDocument();
  });

  it("[FAM-01][AC-02] Physiotherapy at 11:30 for 90 minutes reads '1 hr 30 min' and 'Planned', ending 13:00", async () => {
    await renderHome();
    const today = screen.getByRole("region", { name: "Today" });

    const block = within(today).getByRole("link", { name: /Physiotherapy/ });
    expect(within(block).getByText("1 hr 30 min")).toBeInTheDocument();
    expect(within(block).getByText("Planned")).toBeInTheDocument();
    // The accessible name carries the time range.
    expect(block).toHaveAccessibleName(/11:30/);
    expect(block).toHaveAccessibleName(/13:00/);
  });

  it("[FAM-01][AC-04] no occurrences today shows the empty state and no blocks", async () => {
    mocks.getTodayOccurrences.mockResolvedValue([]);
    await renderHome();
    const today = screen.getByRole("region", { name: "Today" });

    expect(within(today).getByText("No care events today")).toBeInTheDocument();
    expect(within(today).queryByRole("link")).not.toBeInTheDocument();
  });

  it("[FAM-01][AC-06] a failing occurrence query shows the error state with Retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getTodayOccurrences.mockRejectedValue(new Error("x"));
    const user = userEvent.setup();
    await renderHome();

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});

describe("[FAM-01][AC-03] layout numbers", () => {
  it("[FAM-01][AC-03] events at 09:00 (60 min) and 11:30 (90 min) sit at 88px and 198px and are 44px and 66px tall", () => {
    const { blocks } = layoutDay([MORNING_MEDS, PHYSIOTHERAPY]);

    expect(blocks.map((block) => [block.top, block.height])).toEqual([
      [88, 44],
      [198, 66],
    ]);
  });
});

describe("[FAM-01][AC-05] the page checks the client before it reads anything", () => {
  it("[FAM-01][AC-05] checks access for the route's client before any contract read", async () => {
    const order: string[] = [];
    mocks.assertClientAccess.mockImplementation(async () => void order.push("access"));
    mocks.getTodayOccurrences.mockImplementation(async () => (order.push("today"), []));

    await renderHome(CLIENT_ID);

    expect(mocks.assertClientAccess).toHaveBeenCalledWith(CLIENT_ID);
    expect(order[0]).toBe("access");
  });

  it("[FAM-01][AC-05] Helen requesting Robert's home is redirected and none of his data is fetched", async () => {
    const redirect = redirectError("/family/client-margaret/home");
    mocks.assertClientAccess.mockRejectedValue(redirect);

    await expect(
      FamilyHomePage({ params: Promise.resolve({ clientId: OTHER_CLIENT_ID }) }),
    ).rejects.toBe(redirect);

    expect(mocks.assertClientAccess).toHaveBeenCalledWith(OTHER_CLIENT_ID);
    expect(mocks.getTodayOccurrences).not.toHaveBeenCalled();
    expect(mocks.getTaskLog).not.toHaveBeenCalled();
    expect(mocks.getBudgetSummary).not.toHaveBeenCalled();
  });

  it("[FAM-01][AC-05] the redirect is not swallowed into the page's error state", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.assertClientAccess.mockRejectedValue(redirectError("/family/client-margaret/home"));

    await expect(
      FamilyHomePage({ params: Promise.resolve({ clientId: OTHER_CLIENT_ID }) }),
    ).rejects.toMatchObject({ message: "NEXT_REDIRECT" });
  });
});
