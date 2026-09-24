import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => router,
}));

import EditEventPage from "./page";

const ID = "client-margaret";
const PHYSIO = "event-margaret-physio";
const PHYSIO_DESCRIPTION =
  "Mobility and strength session with the physiotherapist. Focus on balance exercises per the current care plan.";

type SearchParams = Record<string, string | string[] | undefined>;

async function renderEdit(eventId = PHYSIO, searchParams: SearchParams = {}, clientId = ID) {
  return render(
    await EditEventPage({
      params: Promise.resolve({ clientId, eventId }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("[FAM-UI-03] /family/[clientId]/events/[eventId]/edit (real mock contract, DATA_SOURCE=mock)", () => {
  it("[FAM-UI-03][AC-01] shows Date 'Monday 30 November 2026', Recurring 'Weekly', Status Planned and the description", async () => {
    await renderEdit();

    expect(screen.getByRole("heading", { level: 1, name: "Edit event" })).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveValue("Monday 30 November 2026");
    const recurring = screen.getByLabelText("Recurring");
    expect(recurring).toHaveValue("weekly");
    expect(within(recurring).getByRole("option", { selected: true })).toHaveTextContent("Weekly");
    expect(screen.getByRole("radio", { name: "Planned" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Description")).toHaveValue(PHYSIO_DESCRIPTION);
  });

  it("[FAM-UI-03][AC-01] ?occurrence= opens that occurrence's date and status", async () => {
    await renderEdit(PHYSIO, { occurrence: `${PHYSIO}:2026-11-28T11:30:00+11:00` });

    expect(screen.getByLabelText("Date")).toHaveValue("Saturday 28 November 2026");
    expect(screen.getByRole("radio", { name: "Done" })).toHaveAttribute("aria-checked", "true");
  });

  it("[FAM-UI-03][PRD] an ?occurrence= of another event is ignored, not shown", async () => {
    await renderEdit(PHYSIO, {
      occurrence: "event-margaret-morning-meds:2026-11-30T09:00:00+11:00",
    });

    expect(screen.getByLabelText("Date")).toHaveValue("Monday 30 November 2026");
    expect(screen.getByLabelText("Description")).toHaveValue(PHYSIO_DESCRIPTION);
  });

  it("[FAM-UI-03][AC-03] shows document tiles 'Physio referral.pdf' and 'Exercise plan.pdf' and an 'Add file' tile", async () => {
    await renderEdit();

    const documents = screen.getByRole("region", { name: "Documents" });
    expect(within(documents).getByText("Physio referral.pdf")).toBeInTheDocument();
    expect(within(documents).getByText("Exercise plan.pdf")).toBeInTheDocument();
    expect(within(documents).getByRole("button", { name: "Add file" })).toBeInTheDocument();
  });

  it("[FAM-UI-03][PRD] 'Add file' uploads nothing and says so", async () => {
    const user = userEvent.setup();
    await renderEdit();

    await user.click(screen.getByRole("button", { name: "Add file" }));

    expect(screen.getByRole("status")).toHaveTextContent(/not available yet/i);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("[FAM-UI-03][PRD] Save event returns to the previous screen without persisting; Cancel returns too", async () => {
    const user = userEvent.setup();
    await renderEdit();

    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(router.back).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(router.back).toHaveBeenCalledTimes(2);
  });

  it("[FAM-UI-03][PRD] edits change local state only", async () => {
    const user = userEvent.setup();
    await renderEdit();

    await user.selectOptions(screen.getByLabelText("Recurring"), "monthly");
    await user.click(screen.getByTestId("date-picker-day-2026-11-24"));

    expect(screen.getByLabelText("Recurring")).toHaveValue("monthly");
    expect(screen.getByLabelText("Date")).toHaveValue("Tuesday 24 November 2026");
  });

  it("[FAM-UI-03][PRD] an unknown event, or another client's event, is a 404", async () => {
    await expect(renderEdit("no-such-event")).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
    await expect(renderEdit(PHYSIO, {}, "client-robert")).rejects.toThrow(
      /NEXT_HTTP_ERROR_FALLBACK;404/,
    );
  });
});
