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

function renderNew() {
  return render(NewEventPage());
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

  it("[FAM-UI-03][AC-02] once a date is picked, Save event returns to the previous screen", async () => {
    const user = userEvent.setup();
    await renderNew();

    const [firstDay] = screen.getAllByTestId(/^date-picker-day-/);
    await user.click(firstDay!);
    expect(screen.getByLabelText("Date")).not.toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("[FAM-UI-03][PRD] the Add event page has no axe violations, including with the Date error shown", async () => {
    const user = userEvent.setup();
    const { container } = renderNew();
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(await axe(container)).toHaveNoViolations();
  });
});
