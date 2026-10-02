import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ManageScreen } from "./manage-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/manage",
  useSearchParams: () => new URLSearchParams("staff=aisha&client=margaret"),
}));

const data = {
  referenceDate: "2026-11-30",
  staff: [{ id: "aisha", name: "Aisha Rahman" }],
  clients: [{ id: "margaret", name: "Margaret Doyle" }],
  shifts: [
    {
      id: "s1",
      staffId: "aisha",
      clientId: "margaret",
      date: "2026-11-26",
      start: "11:30",
      end: "13:00",
    },
  ],
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-24T02:00:00Z")); // 13:00 on the 24th in Melbourne
});
afterEach(() => vi.useRealTimers());

describe("[FAM-16][AC-07] the Admin Manage 'Shift date' picker keeps working", () => {
  it("[FAM-16][AC-07] rings today, selects a day, shows the dot and pages months", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ManageScreen data={data} selection={{ staffId: "aisha", clientId: "margaret" }} />);

    expect(screen.getByTestId("date-picker-day-2026-11-24")).toHaveAttribute(
      "aria-current",
      "date",
    );
    expect(screen.getByTestId("date-picker-day-2026-11-26")).toHaveAttribute(
      "data-has-items",
      "true",
    );

    await user.click(screen.getByTestId("date-picker-day-2026-11-25"));
    expect(screen.getByTestId("date-picker-day-2026-11-25")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("December 2026")).toBeInTheDocument();
  });
});
