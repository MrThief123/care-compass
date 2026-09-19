import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { getTaskLog } from "@/server/events/queries";
import type { Occurrence } from "@/types/domain";

import { NAME_60, NON_ASCII_TITLES, TITLE_120, makeHistory } from "./fake-task-log";
import { TaskLogTable } from "./task-log-table";

const ID = "client-margaret";

function renderTable(items: Occurrence[], onOpen: (occurrence: Occurrence) => void = vi.fn()) {
  return {
    onOpen,
    ...render(
      <TaskLogTable clientId={ID} items={items} params={{ q: "", page: 1 }} onOpen={onOpen} />,
    ),
  };
}

const bodyRows = () => screen.getAllByRole("row").slice(1);
const headerRow = () => screen.getAllByRole("row")[0]!;
const cellsOf = (row: HTMLElement) => within(row).getAllByRole("cell");
const classesOf = (element: Element) => [...element.classList];

/** The grid template the row uses at the wide (table) layout, e.g. `@3xl:grid-cols-[7rem_minmax(0,1fr)_...]`. */
function wideTemplate(row: Element): string {
  const token = classesOf(row).find((name) => name.startsWith("@3xl:grid-cols-["));
  expect(token, "the row has a wide-layout grid template").toBeDefined();
  return token!;
}

/** The nine-row design week and the rest of page 1, through the real contract. */
async function pageOne() {
  return (await getTaskLog(ID, { page: 1 })).items;
}

/** Hostile-but-plausible data: 120-character titles, 60-character names, non-ASCII, unbroken runs. */
function awkwardRows(): Occurrence[] {
  const rows = makeHistory(20, { titleAt: { 0: "W".repeat(300), 1: NON_ASCII_TITLES[0]! } });
  rows[2] = { ...rows[2]!, title: TITLE_120, status: "done", actor: NAME_60, assignee: NAME_60 };
  return rows;
}

describe("[FAM-UI-07][PRD] TaskLogTable: columns that cannot push each other around", () => {
  it("[FAM-UI-07][PRD] puts the header and every row on one grid of fixed column tracks, so no cell's content can widen or squeeze a neighbour", async () => {
    renderTable(await pageOne());

    const template = wideTemplate(headerRow());
    // DATE, TASK, NURSE, STATUS, chevron: five tracks, and only the TASK track is flexible.
    expect(template).toMatch(/^@3xl:grid-cols-\[[^\]]+\]$/);
    expect(template.match(/minmax\(0,1fr\)/g)).toHaveLength(1);
    // No track is sized by what is inside it (that is what let a 430px pill squeeze TASK).
    expect(template).not.toMatch(/auto|max-content|min-content|fit-content/);

    for (const row of bodyRows()) {
      expect(classesOf(row)).toContain("grid");
      expect(wideTemplate(row)).toBe(template);
    }
    expect(classesOf(headerRow())).toContain("grid");
  });

  it("[FAM-UI-07][PRD] every header and body cell can shrink (min-w-0) and sits in its own named grid area", async () => {
    renderTable(await pageOne());

    const cells = [...within(headerRow()).getAllByRole("columnheader", { hidden: true })];
    expect(cells).toHaveLength(5);
    for (const row of bodyRows()) cells.push(...within(row).getAllByRole("cell", { hidden: true }));

    for (const cell of cells) {
      expect(classesOf(cell)).toContain("min-w-0");
      expect(classesOf(cell).some((name) => name.startsWith("[grid-area:"))).toBe(true);
    }
    const areas = cellsOf(bodyRows()[0]!).map((cell) =>
      classesOf(cell).find((name) => name.startsWith("[grid-area:")),
    );
    expect(areas).toEqual([
      "[grid-area:date]",
      "[grid-area:task]",
      "[grid-area:nurse]",
      "[grid-area:status]",
    ]);
  });

  it("[FAM-UI-07][PRD] switches between the table layout and the compact card layout by the width of the log itself, not of the window", async () => {
    const { container } = renderTable(await pageOne());

    expect(container.firstElementChild).toHaveClass("@container");
    for (const row of [headerRow(), ...bodyRows()]) {
      const names = classesOf(row);
      // Card layout is the base (three stacked lines); the table layout only from the breakpoint.
      expect(names.some((name) => name.startsWith("[grid-template-areas:'task_task_chev'"))).toBe(
        true,
      );
      expect(names.some((name) => name.startsWith("@3xl:[grid-template-areas:'date_task"))).toBe(
        true,
      );
    }
  });
});

describe("[FAM-UI-07][PRD] TaskLogTable: text is wrapped or cut, never overlapped", () => {
  it("[FAM-UI-07][PRD] clamps a long task title to two lines, breaks unbroken runs, and keeps the whole title on hover and in the DOM", () => {
    const rows = awkwardRows();
    renderTable(rows);

    for (const row of rows) {
      const link = screen.getAllByRole("link").find((a) => a.getAttribute("title") === row.title);
      expect(link, `link for "${row.title.slice(0, 20)}"`).toBeDefined();
      const text = within(link!).getByText(row.title);
      expect(classesOf(text)).toEqual(expect.arrayContaining(["line-clamp-2", "min-w-0"]));
      expect(classesOf(text)).toContain("[overflow-wrap:anywhere]");
      expect(classesOf(link!)).toEqual(expect.arrayContaining(["min-h-11", "max-w-full"]));
      // CSS does the cutting: the DOM (and so a screen reader) still has every character.
      expect(text.textContent).toBe(row.title);
    }
  });

  it("[FAM-UI-07][PRD] shows the nurse on one truncating line with the full name on hover", () => {
    const rows = awkwardRows();
    renderTable(rows);

    const cell = cellsOf(bodyRows()[2]!)[2]!;
    const name = within(cell).getByText(NAME_60);
    expect(classesOf(name)).toEqual(expect.arrayContaining(["truncate", "min-w-0"]));
    expect(name).toHaveAttribute("title", NAME_60);
  });

  it("[FAM-UI-07][PRD] never lets the status pill be wider than its cell: it may shrink, its label ends in an ellipsis, and the full text is on hover and in the DOM", () => {
    const rows = awkwardRows();
    renderTable(rows);

    const cell = cellsOf(bodyRows()[2]!)[3]!;
    const wrapper = cell.firstElementChild as HTMLElement;
    expect(classesOf(wrapper)).toEqual(expect.arrayContaining(["min-w-0", "max-w-full"]));
    expect(wrapper).toHaveAttribute("title", `Done · ${NAME_60}`);

    const label = within(cell).getByText(`Done · ${NAME_60}`);
    expect(classesOf(label)).toContain("truncate");
    // Not by colour alone: an icon and the word, and the whole name for assistive technology.
    expect(within(cell).getByTestId("icon-check")).toBeInTheDocument();
    expect(cell).toHaveTextContent(`Done · ${NAME_60}`);
    const pill = label.parentElement!;
    expect(classesOf(pill)).toEqual(expect.arrayContaining(["max-w-full", "min-w-0"]));
  });

  it("[FAM-UI-07][PRD] keeps Overdue and Planned readable by word and icon, not colour alone", async () => {
    const items = await pageOne();
    renderTable(items);

    const overdue = bodyRows().find((row) => within(row).queryByText("Overdue"));
    const planned = bodyRows().find((row) => within(row).queryByText("Planned"));
    expect(within(overdue!).getByTestId("icon-alert-triangle")).toBeInTheDocument();
    expect(planned).toBeDefined();
  });

  it("[FAM-UI-07][PRD] keeps the date on one line in its own cell", async () => {
    const items = await pageOne();
    renderTable(items);

    const date = cellsOf(bodyRows()[0]!)[0]!;
    expect(date).toHaveTextContent("Mon 30 Nov");
    expect(classesOf(date)).toContain("whitespace-nowrap");
  });
});

describe("[FAM-UI-07][PRD] TaskLogTable: one structure, every way in", () => {
  it("[FAM-UI-07][PRD] renders each task once: one table, one link and one copy of every title, so the card layout hides nothing and doubles nothing", async () => {
    const items = await pageOne();
    renderTable(items);

    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(bodyRows()).toHaveLength(items.length);
    expect(screen.getAllByRole("link")).toHaveLength(items.length);
    for (const [index, row] of bodyRows().entries()) {
      expect(within(row).getAllByText(items[index]!.title)).toHaveLength(1);
      expect(within(row).getAllByRole("link")).toHaveLength(1);
    }
  });

  it("[FAM-UI-07][PRD] keeps the column headers for assistive technology below the breakpoint by hiding them visually, not with display:none", async () => {
    renderTable(await pageOne());

    const head = headerRow().parentElement!;
    expect(classesOf(head)).toEqual(expect.arrayContaining(["sr-only", "@3xl:not-sr-only"]));
    expect(classesOf(head)).not.toContain("hidden");
    for (const name of ["Date", "Task", "Nurse", "Status"]) {
      expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
    }
  });

  it("[FAM-UI-07][PRD] keeps table semantics explicit, so a browser that drops them when the display changes still announces a table", async () => {
    renderTable(await pageOne());

    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("role", "table");
    for (const group of table.querySelectorAll("thead, tbody")) {
      expect(group).toHaveAttribute("role", "rowgroup");
    }
    for (const row of screen.getAllByRole("row")) expect(row).toHaveAttribute("role", "row");
    for (const cell of screen.getAllByRole("cell")) expect(cell).toHaveAttribute("role", "cell");
    for (const head of screen.getAllByRole("columnheader")) {
      expect(head).toHaveAttribute("role", "columnheader");
    }
  });

  it("[FAM-UI-07][PRD] opens a task from the row and from its link without navigating twice", async () => {
    const user = userEvent.setup();
    const items = await pageOne();
    const { onOpen } = renderTable(items);

    await user.click(within(bodyRows()[1]!).getByText(items[1]!.title));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(items[1]);

    onOpen.mockClear();
    await user.click(within(bodyRows()[1]!).getByRole("link"));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("[FAM-UI-07][PRD] is accessible (axe) with 120-character titles, 60-character names, an unbroken 300-character title and non-ASCII text", async () => {
    const { container } = renderTable(awkwardRows());

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-07][PRD] holds a full page of awkward rows: 20 links, each with its whole title in `title`", () => {
    const rows = awkwardRows();
    renderTable(rows);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(20);
    expect(links.map((link) => link.getAttribute("title"))).toEqual(rows.map((row) => row.title));
  });
});
