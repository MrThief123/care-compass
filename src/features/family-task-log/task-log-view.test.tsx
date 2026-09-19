import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { DESIGN_CLIENT_ID, DESIGN_TASK_LOG } from "./design-fixtures";
import { TaskLogView } from "./task-log-view";
import { taskDetailHref } from "./task-routes";

function renderLog(items = DESIGN_TASK_LOG) {
  return render(<TaskLogView clientId={DESIGN_CLIENT_ID} items={items} />);
}

/** Body rows only (the header row is always first). */
function dataRows(): HTMLElement[] {
  return screen.queryAllByRole("row").slice(1);
}

/** Visible text of the DATE, TASK, NURSE and STATUS cells (the chevron cell is decorative). */
function cellTexts(row: HTMLElement): string[] {
  return within(row)
    .getAllByRole("cell")
    .slice(0, 4)
    .map((cell) => cell.textContent ?? "");
}

const DESIGN_ROWS = [
  ["Mon 30 Nov", "Morning medication", "Aisha Rahman", "Done · Aisha Rahman"],
  ["Mon 30 Nov", "Physiotherapy", "Aisha Rahman", "Planned"],
  ["Mon 30 Nov", "Afternoon check-in", "Aisha Rahman", "Planned"],
  ["Sun 29 Nov", "Evening medication", "Aisha Rahman", "Done · Aisha Rahman"],
  ["Sun 29 Nov", "Weekly weigh-in", "—", "Overdue"],
  ["Sat 28 Nov", "Physiotherapy", "Aisha Rahman", "Done · Aisha Rahman"],
  ["Sat 28 Nov", "Medication review", "—", "Overdue"],
  ["Fri 27 Nov", "Morning medication", "Aisha Rahman", "Done · Aisha Rahman"],
  ["Thu 26 Nov", "Wound dressing check", "Aisha Rahman", "Done · Aisha Rahman"],
];

describe("[FAM-UI-07] TaskLogView", () => {
  it("[FAM-UI-07][AC-01] renders 9 rows starting Mon 30 Nov · Morning medication · Aisha Rahman · Done · Aisha Rahman", () => {
    renderLog();

    const rows = dataRows();
    expect(rows).toHaveLength(9);
    expect(cellTexts(rows[0]!)).toEqual([
      "Mon 30 Nov",
      "Morning medication",
      "Aisha Rahman",
      "Done · Aisha Rahman",
    ]);
  });

  it("[FAM-UI-07][AC-01] lists every design row: date, task, nurse and status pill", () => {
    renderLog();

    expect(dataRows().map(cellTexts)).toEqual(DESIGN_ROWS);
  });

  it("[FAM-UI-07][AC-01] shows the Task log title, DATE · TASK · NURSE · STATUS headers, search field and All statuses select", () => {
    renderLog();

    expect(screen.getByRole("heading", { level: 1, name: "Task log" })).toBeInTheDocument();
    for (const name of ["Date", "Task", "Nurse", "Status"]) {
      expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
    }
    expect(screen.getByPlaceholderText("Search tasks")).toBeInTheDocument();

    const select = screen.getByLabelText("Status");
    expect(select).toHaveDisplayValue("All statuses");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All statuses", "Planned", "Done", "Overdue"]);
  });

  it("[FAM-UI-07][AC-01] orders rows newest day first whatever order they arrive in (OQ-31 default)", () => {
    renderLog([...DESIGN_TASK_LOG].reverse());

    expect(dataRows().map((row) => cellTexts(row)[0])).toEqual(DESIGN_ROWS.map((row) => row[0]));
  });

  it("[FAM-UI-07][AC-02] shows only Weekly weigh-in and Medication review, each with nurse '—', when Status is Overdue", async () => {
    const user = userEvent.setup();
    renderLog();

    await user.selectOptions(screen.getByLabelText("Status"), "Overdue");

    expect(dataRows().map(cellTexts)).toEqual([
      ["Sun 29 Nov", "Weekly weigh-in", "—", "Overdue"],
      ["Sat 28 Nov", "Medication review", "—", "Overdue"],
    ]);
  });

  it("[FAM-UI-07][AC-02] shows the planned rows when Status is Planned and everything again on All statuses", async () => {
    const user = userEvent.setup();
    renderLog();

    await user.selectOptions(screen.getByLabelText("Status"), "Planned");
    expect(dataRows().map((row) => cellTexts(row)[1])).toEqual([
      "Physiotherapy",
      "Afternoon check-in",
    ]);

    await user.selectOptions(screen.getByLabelText("Status"), "All statuses");
    expect(dataRows()).toHaveLength(9);
  });

  it("[FAM-UI-07][AC-03] shows 'No matches for \"Zoe\".' and no rows when the search matches nothing", async () => {
    const user = userEvent.setup();
    renderLog();

    await user.type(screen.getByPlaceholderText("Search tasks"), "Zoe");

    expect(screen.getByText('No matches for "Zoe".')).toBeInTheDocument();
    expect(dataRows()).toHaveLength(0);
  });

  it("[FAM-UI-07][AC-03] matches task titles case-insensitively and combines the search with the status filter", async () => {
    const user = userEvent.setup();
    renderLog();

    await user.type(screen.getByPlaceholderText("Search tasks"), "PHYSIO");
    expect(dataRows().map((row) => cellTexts(row)[0])).toEqual(["Mon 30 Nov", "Sat 28 Nov"]);

    await user.selectOptions(screen.getByLabelText("Status"), "Done");
    expect(dataRows().map(cellTexts)).toEqual([
      ["Sat 28 Nov", "Physiotherapy", "Aisha Rahman", "Done · Aisha Rahman"],
    ]);
  });

  it("[FAM-UI-07][AC-03] brings every row back when the search is cleared", async () => {
    const user = userEvent.setup();
    renderLog();

    await user.type(screen.getByPlaceholderText("Search tasks"), "Zoe");
    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(dataRows()).toHaveLength(9);
    expect(screen.queryByText(/No matches for/)).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] announces how many tasks are shown to assistive technology", async () => {
    const user = userEvent.setup();
    renderLog();

    expect(screen.getByRole("status")).toHaveTextContent("Showing 9 of 9 tasks");

    await user.selectOptions(screen.getByLabelText("Status"), "Overdue");
    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 9 tasks");
  });

  it("[FAM-UI-07][PRD] each task is a link to its detail page and clicking the row navigates there", async () => {
    const user = userEvent.setup();
    push.mockClear();
    renderLog();

    const first = DESIGN_TASK_LOG[0]!;
    const href = taskDetailHref(DESIGN_CLIENT_ID, first.key);
    const rows = dataRows();

    expect(within(rows[0]!).getByRole("link", { name: "Morning medication" })).toHaveAttribute(
      "href",
      href,
    );

    await user.click(within(rows[0]!).getByText("Aisha Rahman"));
    expect(push).toHaveBeenCalledExactlyOnceWith(href);
  });

  it("[FAM-UI-07][PRD] clicking the task link does not also trigger the row's own navigation", async () => {
    const user = userEvent.setup();
    push.mockClear();
    const { container } = renderLog();
    // jsdom cannot navigate; cancel the link's default action so it does not log noise.
    // (On the container, not the document: the link stops the click from bubbling that far.)
    container.addEventListener("click", (event) => event.preventDefault(), { once: true });

    await user.click(screen.getAllByRole("link", { name: "Physiotherapy" })[0]!);

    expect(push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-07][PRD] shows an empty state, and no table, when there are no tasks at all", () => {
    renderLog([]);

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows a no-tasks-found state when the status filter alone matches nothing", async () => {
    const user = userEvent.setup();
    renderLog(DESIGN_TASK_LOG.filter((item) => item.status !== "overdue"));

    await user.selectOptions(screen.getByLabelText("Status"), "Overdue");

    expect(screen.getByText("No tasks found")).toBeInTheDocument();
    expect(screen.queryByText(/No matches for/)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] renders a very long task title in full rather than dropping text", () => {
    const longTitle = `Medication ${"administration and observation ".repeat(8).trim()}`;
    renderLog([{ ...DESIGN_TASK_LOG[0]!, title: longTitle }]);

    expect(screen.getByRole("link", { name: longTitle })).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] has no axe violations, with results and with none", async () => {
    const user = userEvent.setup();
    const { container } = renderLog();
    expect(await axe(container)).toHaveNoViolations();

    await user.type(screen.getByPlaceholderText("Search tasks"), "Zoe");
    expect(await axe(container)).toHaveNoViolations();
  });
});
