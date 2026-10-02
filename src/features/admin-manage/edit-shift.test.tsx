import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ManageScreen } from "./manage-screen";

/*
 * ADM-09: Edit and Cancel on the shifts listed on Manage. Built from tokens, no design (OQ-19 /
 * PD-052, FD-01). `updateShift` and `cancelShift` are replaced so each test decides what they
 * return; what they do is covered in src/server/admin/shift-edit-actions.test.ts,
 * supabase/tests/admin_edit_shift.test.sql and tests/integration/admin-edit-shift.test.ts.
 */
const mocks = vi.hoisted(() => ({
  assign: vi.fn(),
  update: vi.fn(),
  cancel: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.replace, refresh: vi.fn() }),
  usePathname: () => "/admin/manage",
  useSearchParams: () => new URLSearchParams("staff=aisha&client=margaret"),
}));
vi.mock("@/server/admin/manage-actions", () => ({
  assignShift: mocks.assign,
  updateShift: mocks.update,
  cancelShift: mocks.cancel,
}));

const selection = { staffId: "aisha", clientId: "margaret" };

/** Aisha on 30 Nov: Margaret 11:30-13:00 (live), Robert 07:00-09:00 (ended), Robert 14:00-16:00. */
const live = {
  id: "live",
  staffId: "aisha",
  clientId: "margaret",
  date: "2026-11-30",
  start: "11:30",
  end: "13:00",
  staffName: "Aisha Rahman",
  clientName: "Margaret Doyle",
  editable: true,
};
const ended = {
  id: "ended",
  staffId: "aisha",
  clientId: "robert",
  date: "2026-11-30",
  start: "07:00",
  end: "09:00",
  staffName: "Aisha Rahman",
  clientName: "Robert Hale",
  editable: false,
};
const later = {
  id: "later",
  staffId: "aisha",
  clientId: "robert",
  date: "2026-11-30",
  start: "14:00",
  end: "16:00",
  staffName: "Aisha Rahman",
  clientName: "Robert Hale",
  editable: true,
};

const data = {
  referenceDate: "2026-11-30",
  staff: [
    { id: "aisha", name: "Aisha Rahman" },
    { id: "daniel", name: "Daniel Kelly" },
  ],
  clients: [{ id: "margaret", name: "Margaret Doyle" }],
  shifts: [live, ended, later],
};

beforeEach(() => {
  mocks.update.mockImplementation(
    async (input: { shiftId: string; carerId: string; start: string; end: string }) => ({
      ok: true,
      data: {
        ...live,
        id: input.shiftId,
        staffId: input.carerId,
        start: input.start,
        end: input.end,
      },
    }),
  );
  mocks.cancel.mockImplementation(async (shiftId: string) => ({ ok: true, data: { id: shiftId } }));
});
afterEach(() => vi.resetAllMocks());

const day = (date: string) => screen.getByTestId(`date-picker-day-${date}`);
const carerRows = () => within(screen.getByRole("list", { name: "Aisha Rahman's shifts" }));

describe("[ADM-09][AC-08] Edit and Cancel appear only on shifts that can still change", () => {
  it("[ADM-09][AC-08] the live and the later shift have both buttons; the ended shift has neither", () => {
    render(<ManageScreen data={data} selection={selection} />);

    expect(
      carerRows().getByRole("button", {
        name: "Edit shift, Aisha Rahman, Margaret Doyle, 11:30 - 13:00",
      }),
    ).toBeVisible();
    expect(
      carerRows().getByRole("button", {
        name: "Cancel shift, Aisha Rahman, Margaret Doyle, 11:30 - 13:00",
      }),
    ).toBeVisible();
    expect(
      carerRows().getByRole("button", {
        name: "Edit shift, Aisha Rahman, Robert Hale, 14:00 - 16:00",
      }),
    ).toBeVisible();
    // Absent, not disabled (CLAUDE.md §7).
    expect(
      carerRows().queryByRole("button", {
        name: /shift, Aisha Rahman, Robert Hale, 07:00 - 09:00/,
      }),
    ).not.toBeInTheDocument();
    expect(carerRows().getByText("07:00 - 09:00")).toBeVisible();
  });
});

describe("[ADM-09][AC-08] Edit panel", () => {
  async function openEdit() {
    await userEvent.click(
      carerRows().getByRole("button", {
        name: "Edit shift, Aisha Rahman, Margaret Doyle, 11:30 - 13:00",
      }),
    );
  }

  it("[ADM-09][AC-08] opens pre-filled with the shift's carer, start and end", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await openEdit();

    expect(screen.getByRole("heading", { name: "Edit shift" })).toBeVisible();
    expect(screen.getByLabelText("Carer")).toHaveValue("aisha");
    expect(screen.getByLabelText("Start hour")).toHaveValue("11");
    expect(screen.getByLabelText("Start minute")).toHaveValue("30");
    expect(screen.getByLabelText("End hour")).toHaveValue("13");
    expect(screen.getByLabelText("End minute")).toHaveValue("00");
    // The Assign form is replaced while editing.
    expect(screen.queryByRole("button", { name: "Assign shift" })).not.toBeInTheDocument();
  });

  it("[ADM-09][AC-08] extending to 15:00 and saving calls updateShift with exactly that, updates the row and shows a status", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await openEdit();
    await userEvent.selectOptions(screen.getByLabelText("End hour"), "15");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith({
      shiftId: "live",
      carerId: "aisha",
      start: "11:30",
      end: "15:00",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Shift updated: Aisha Rahman → Margaret Doyle, 2026-11-30, 11:30 - 15:00.",
    );
    expect(carerRows().getByText("11:30 - 15:00")).toBeVisible();
    expect(carerRows().queryByText("11:30 - 13:00")).not.toBeInTheDocument();
    // The panel is back to Assign.
    expect(screen.queryByRole("heading", { name: "Edit shift" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assign shift" })).toBeVisible();
  });

  it("[ADM-09][AC-08] choosing another carer sends that carer", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await openEdit();
    await userEvent.selectOptions(screen.getByLabelText("Carer"), "daniel");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ shiftId: "live", carerId: "daniel" }),
    );
  });

  it("[ADM-09][AC-08] the overlap warning names the carer's other shift and never the shift being edited, and Save stays available", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await openEdit();

    // 12:00-13:00 sits inside the shift's own 11:30-13:00: not an overlap with another shift.
    await userEvent.selectOptions(screen.getByLabelText("Start hour"), "12");
    await userEvent.selectOptions(screen.getByLabelText("Start minute"), "00");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("End hour"), "15");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Aisha Rahman already has a shift with Robert Hale from 14:00 - 16:00 that overlaps this time. You can still save it.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("Margaret Doyle");
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ end: "15:00" }));
  });

  it("[ADM-09][AC-08] an end before the start shows the time error and calls nothing", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await openEdit();
    await userEvent.selectOptions(screen.getByLabelText("End hour"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("End time must be after start time.")).toBeVisible();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("[ADM-09][AC-08] a refused save shows the server's message and keeps the old times", async () => {
    mocks.update.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "That shift can't be changed." },
    });
    render(<ManageScreen data={data} selection={selection} />);
    await openEdit();
    await userEvent.selectOptions(screen.getByLabelText("End hour"), "15");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("That shift can't be changed.")).toBeVisible();
    expect(carerRows().getByText("11:30 - 13:00")).toBeVisible();
    expect(screen.queryByText(/Shift updated/)).not.toBeInTheDocument();
  });

  it("[ADM-09][AC-08] a thrown action is a failed save, not a crash", async () => {
    mocks.update.mockRejectedValue(new Error("network"));
    render(<ManageScreen data={data} selection={selection} />);
    await openEdit();
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Couldn't update the shift. Try again.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });

  it("[ADM-09][AC-08] Stop editing closes the panel and calls nothing", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await openEdit();
    await userEvent.click(screen.getByRole("button", { name: "Stop editing" }));

    expect(screen.queryByRole("heading", { name: "Edit shift" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assign shift" })).toBeVisible();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("[ADM-09][AC-09] Cancel shift", () => {
  const cancelButton = () =>
    carerRows().getByRole("button", {
      name: "Cancel shift, Aisha Rahman, Margaret Doyle, 11:30 - 13:00",
    });

  it("[ADM-09][AC-09] the dialog names carer, client, date and times; Keep shift closes it and calls nothing", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(cancelButton());

    const dialog = screen.getByRole("dialog", { name: "Cancel this shift?" });
    expect(dialog).toHaveTextContent("Aisha Rahman");
    expect(dialog).toHaveTextContent("Margaret Doyle");
    expect(dialog).toHaveTextContent("2026-11-30");
    expect(dialog).toHaveTextContent("11:30 - 13:00");

    await userEvent.click(within(dialog).getByRole("button", { name: "Keep shift" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.cancel).not.toHaveBeenCalled();
    expect(carerRows().getByText("11:30 - 13:00")).toBeVisible();
  });

  it("[ADM-09][AC-09] Cancel shift calls cancelShift, removes the row and the date's dot, and shows a status", async () => {
    render(<ManageScreen data={{ ...data, shifts: [live] }} selection={selection} />);
    expect(day("2026-11-30")).toHaveAttribute("data-has-items", "true");

    await userEvent.click(cancelButton());
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel shift" }),
    );

    expect(mocks.cancel).toHaveBeenCalledTimes(1);
    expect(mocks.cancel).toHaveBeenCalledWith("live");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Shift cancelled: Aisha Rahman → Margaret Doyle, 2026-11-30, 11:30 - 13:00.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("11:30 - 13:00", { selector: "li *" })).not.toBeInTheDocument();
    expect(day("2026-11-30")).toHaveAttribute("data-has-items", "false");
  });

  it("[ADM-09][AC-09] other shifts that day keep the dot", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(cancelButton());
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel shift" }),
    );
    await screen.findByRole("status");

    expect(day("2026-11-30")).toHaveAttribute("data-has-items", "true");
  });

  it("[ADM-09][AC-09] a failed cancel shows an alert and keeps the shift", async () => {
    mocks.cancel.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't cancel the shift. Try again." },
    });
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(cancelButton());
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel shift" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't cancel the shift. Try again.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(carerRows().getByText("11:30 - 13:00")).toBeVisible();
  });

  it("[ADM-09][AC-09] the screen passes axe with the dialog open, and with the edit panel open", async () => {
    const { container } = render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(cancelButton());
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole("button", { name: "Keep shift" }));

    await userEvent.click(
      carerRows().getByRole("button", {
        name: "Edit shift, Aisha Rahman, Margaret Doyle, 11:30 - 13:00",
      }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
