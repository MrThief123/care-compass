import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => router,
}));

import NewEventPage from "./page";

const ID = "client-margaret";

async function renderNew(clientId = ID, search: Record<string, string> = {}) {
  return render(
    await NewEventPage({
      params: Promise.resolve({ clientId }),
      searchParams: Promise.resolve(search),
    }),
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("[FAM-UI-03] /family/[clientId]/events/new (real mock contract, DATA_SOURCE=mock)", () => {
  it("[FAM-UI-03][PRD] opens an empty Add event form", async () => {
    await renderNew();

    expect(screen.getByRole("heading", { level: 1, name: "Add event" })).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveValue("");
    expect(screen.getByLabelText("Recurring")).toHaveValue("none");
    expect(screen.getByRole("radio", { name: "Planned" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    const documents = screen.getByRole("region", { name: "Documents" });
    expect(within(documents).getByRole("button", { name: "Add file" })).toBeInTheDocument();
    expect(within(documents).queryByText(/\.pdf$/)).not.toBeInTheDocument();
  });

  it("[FAM-UI-03][AC-05] the task switch starts on and can be turned off and on again (local state)", async () => {
    const user = userEvent.setup();
    await renderNew();

    const toggle = screen.getByRole("switch", { name: "This is a task — must be ticked off" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveTextContent("On");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveTextContent("Off");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("[FAM-UI-03][AC-02] Save event with no date shows a Date error and stays on the form", async () => {
    const user = userEvent.setup();
    await renderNew();

    await user.click(screen.getByRole("button", { name: "Save event" }));

    const date = screen.getByLabelText("Date");
    expect(date).toHaveAttribute("aria-invalid", "true");
    expect(date).toHaveAccessibleDescription("Date is required.");
    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-03][AC-09] once a date is picked, Save event goes to Family Home, never router.back (CHG-015)", async () => {
    const user = userEvent.setup();
    await renderNew();

    const [firstDay] = screen.getAllByTestId(/^date-picker-day-/);
    await user.click(firstDay!);
    expect(screen.getByLabelText("Date")).not.toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(router.push).toHaveBeenCalledExactlyOnceWith("/family/client-margaret/home");
    expect(router.back).not.toHaveBeenCalled();
  });

  it("[FAM-UI-03][AC-09] Cancel goes to Family Home, never router.back (CHG-015)", async () => {
    const user = userEvent.setup();
    await renderNew();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(router.push).toHaveBeenCalledExactlyOnceWith("/family/client-margaret/home");
    expect(router.back).not.toHaveBeenCalled();
  });

  it("[FAM-UI-03][AC-09] a hostile client id stays one path segment in the Home link", async () => {
    const user = userEvent.setup();
    await renderNew("../admin?x=1");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(router.push).toHaveBeenCalledExactlyOnceWith("/family/..%2Fadmin%3Fx%3D1/home");
  });

  it("[FAM-UI-03][AC-10] opened from the Calendar, Save event returns to that Calendar view (CHG-017)", async () => {
    const user = userEvent.setup();
    await renderNew(ID, { from: "calendar", view: "month", date: "2026-12-04", month: "2026-12" });

    const [firstDay] = screen.getAllByTestId(/^date-picker-day-/);
    await user.click(firstDay!);
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(router.push).toHaveBeenCalledExactlyOnceWith(
      "/family/client-margaret/calendar?view=month&date=2026-12-04&month=2026-12",
    );
    expect(router.back).not.toHaveBeenCalled();
  });

  it("[FAM-UI-03][AC-10] opened from the Calendar, Cancel returns to that Calendar view (CHG-017)", async () => {
    const user = userEvent.setup();
    await renderNew(ID, { from: "calendar", view: "day", date: "2026-12-01" });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(router.push).toHaveBeenCalledExactlyOnceWith(
      "/family/client-margaret/calendar?view=day&date=2026-12-01",
    );
  });

  it("[FAM-UI-03][AC-10] a Task log or hostile origin still returns to Home", async () => {
    const user = userEvent.setup();
    await renderNew(ID, { from: "tasks", q: "physio" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(router.push).toHaveBeenLastCalledWith("/family/client-margaret/home");
  });

  it("[FAM-UI-03][PRD] the Add event page has no axe violations, including with the Date error shown", async () => {
    const user = userEvent.setup();
    const { container } = await renderNew();
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(await axe(container)).toHaveNoViolations();
  });
});
