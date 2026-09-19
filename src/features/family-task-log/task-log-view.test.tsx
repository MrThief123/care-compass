import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

import { getTaskLog } from "@/server/events/queries";
import type { Occurrence } from "@/types/domain";

import { NAME_60, NON_ASCII_TITLES, TITLE_120, makeHistory } from "./fake-task-log";
import { SEARCH_DEBOUNCE_MS, TaskLogView, type TaskLogViewProps } from "./task-log-view";
import { taskDetailHref } from "./task-routes";

import type { TaskLogParams } from "./task-log-params";

const ID = "client-margaret";
const PLAIN: TaskLogParams = { q: "", page: 1 };
const searchBox = () => screen.getByPlaceholderText("Search tasks");
const statusSelect = () => screen.getByLabelText("Status");

function renderLog(props: Partial<TaskLogViewProps> & { items: Occurrence[] }) {
  const full: TaskLogViewProps = {
    clientId: ID,
    total: props.items.length,
    pageSize: 20,
    params: PLAIN,
    ...props,
  };
  const view = render(<TaskLogView {...full} />);
  return {
    ...view,
    rerenderWith: (next: Partial<TaskLogViewProps>) =>
      view.rerender(<TaskLogView {...full} {...next} />),
  };
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

/** Page 1 of Margaret's log, read through the real contract (mock data source). */
async function firstPage() {
  return getTaskLog(ID, { page: 1 });
}

/** The nine rows of the design week, in the contract's strict newest-first order (UI-04 FD-05). */
const DESIGN_WEEK_ROWS = [
  ["Mon 30 Nov", "Afternoon check-in", "Aisha Rahman", "Planned"],
  ["Mon 30 Nov", "Physiotherapy", "Aisha Rahman", "Planned"],
  ["Mon 30 Nov", "Morning medication", "Aisha Rahman", "Done · Aisha Rahman"],
  ["Sun 29 Nov", "Evening medication", "Aisha Rahman", "Done · Aisha Rahman"],
  ["Sun 29 Nov", "Weekly weigh-in", "—", "Overdue"],
  ["Sat 28 Nov", "Physiotherapy", "Aisha Rahman", "Done · Aisha Rahman"],
  ["Sat 28 Nov", "Medication review", "—", "Overdue"],
  ["Fri 27 Nov", "Morning medication", "Aisha Rahman", "Done · Aisha Rahman"],
  ["Thu 26 Nov", "Wound dressing check", "Aisha Rahman", "Done · Aisha Rahman"],
];

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
});

describe("[FAM-UI-07] TaskLogView on the shared fixtures (real contract, first page)", () => {
  it("[FAM-UI-07][AC-01] renders page 1: 20 rows, newest first, starting Afternoon check-in, Physiotherapy, Morning medication on Mon 30 Nov", async () => {
    const page = await firstPage();
    renderLog({ ...page, params: PLAIN });

    const rows = dataRows();
    expect(rows).toHaveLength(20);
    expect(rows.slice(0, 3).map(cellTexts)).toEqual(DESIGN_WEEK_ROWS.slice(0, 3));
    expect(cellTexts(rows[2]!)).toEqual([
      "Mon 30 Nov",
      "Morning medication",
      "Aisha Rahman",
      "Done · Aisha Rahman",
    ]);
  });

  it("[FAM-UI-07][AC-01] lists all nine design-week rows (Thu 26 to Mon 30 Nov) in order: date, task, nurse and status pill", async () => {
    const page = await firstPage();
    renderLog({ ...page, params: PLAIN });

    expect(dataRows().slice(0, 9).map(cellTexts)).toEqual(DESIGN_WEEK_ROWS);
  });

  it("[FAM-UI-07][AC-01] shows the Task log title, DATE · TASK · NURSE · STATUS headers, search field and an All statuses select", async () => {
    const page = await firstPage();
    renderLog({ ...page, params: PLAIN });

    expect(screen.getByRole("heading", { level: 1, name: "Task log" })).toBeInTheDocument();
    for (const name of ["Date", "Task", "Nurse", "Status"]) {
      expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
    }
    expect(searchBox()).toBeInTheDocument();
    expect(statusSelect()).toHaveDisplayValue("All statuses");
    expect(
      within(statusSelect())
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All statuses", "Planned", "Done", "Overdue"]);
  });

  it("[FAM-UI-07][AC-01] shows the 102-character task title and the 51-character carer name on page 1 without dropping text", async () => {
    const page = await firstPage();
    const long = page.items.find((item) => item.title.length > 100)!;
    const longName = long.actor!;
    expect(long.title).toHaveLength(102);
    expect(longName).toHaveLength(51);
    renderLog({ ...page, params: PLAIN });

    expect(screen.getByRole("link", { name: long.title })).toBeInTheDocument();
    const nurse = within(screen.getByRole("link", { name: long.title }).closest("tr")!).getByTitle(
      longName,
    );
    expect(nurse).toHaveAttribute("title", longName);
    expect(nurse).toHaveClass("truncate");
  });

  it("[FAM-UI-07][AC-01] keeps the order the contract returned and never re-sorts a page", async () => {
    const page = await firstPage();
    const reversed = [...page.items].reverse();
    renderLog({ ...page, items: reversed, params: PLAIN });

    const linkKeys = dataRows().map((row) => within(row).getByRole("link").getAttribute("href"));
    expect(linkKeys).toEqual(reversed.map((item) => taskDetailHref(ID, item.key)));
  });

  it("[FAM-UI-07][AC-02] shows only Weekly weigh-in and Medication review, each with nurse '—', for ?status=overdue", async () => {
    const page = await getTaskLog(ID, { status: "overdue" });
    renderLog({ ...page, params: { q: "", status: "overdue", page: 1 } });

    expect(dataRows().map(cellTexts)).toEqual([
      ["Sun 29 Nov", "Weekly weigh-in", "—", "Overdue"],
      ["Sat 28 Nov", "Medication review", "—", "Overdue"],
    ]);
    expect(statusSelect()).toHaveDisplayValue("Overdue");
  });

  it("[FAM-UI-07][AC-03] shows 'No matches for \"Zoe\".' and no rows for ?q=Zoe, which the contract answers over the whole history", async () => {
    const page = await getTaskLog(ID, { q: "Zoe" });
    renderLog({ ...page, params: { q: "Zoe", page: 1 } });

    expect(screen.getByText('No matches for "Zoe".')).toBeInTheDocument();
    expect(searchBox()).toHaveValue("Zoe");
    expect(dataRows()).toHaveLength(0);
    expect(screen.queryByRole("navigation", { name: "Task log pages" })).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-07] TaskLogView: search, Status and page live in the URL (CHG-005)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  }

  async function elapse(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  const some = () => makeHistory(60).slice(0, 20);

  it("[FAM-UI-07][AC-07] choosing a status updates the URL at once and resets the page to 1, keeping the search", async () => {
    const user = userEvent.setup();
    renderLog({
      items: some(),
      total: 60,
      params: { q: "physio", status: "done", page: 3 },
    });

    await user.selectOptions(statusSelect(), "Planned");

    expect(replace).toHaveBeenCalledExactlyOnceWith(
      "/family/client-margaret/tasks?q=physio&status=planned",
      {
        scroll: false,
      },
    );
  });

  it("[FAM-UI-07][AC-07] choosing All statuses drops the status from the URL", async () => {
    const user = userEvent.setup();
    renderLog({ items: some(), total: 60, params: { q: "", status: "overdue", page: 2 } });

    await user.selectOptions(statusSelect(), "All statuses");

    expect(replace).toHaveBeenCalledExactlyOnceWith("/family/client-margaret/tasks", {
      scroll: false,
    });
  });

  it("[FAM-UI-07][AC-07] typing waits for a pause, then puts the search in the URL on page 1", async () => {
    const user = setup();
    renderLog({ items: some(), total: 60, params: { q: "", status: "done", page: 3 } });

    await user.type(searchBox(), "physio");
    await elapse(SEARCH_DEBOUNCE_MS / 2);
    expect(replace).not.toHaveBeenCalled();

    await elapse(SEARCH_DEBOUNCE_MS);
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      "/family/client-margaret/tasks?q=physio&status=done",
      { scroll: false },
    );
  });

  it("[FAM-UI-07][AC-07] keeps typing from firing a request per key: only the last pause navigates", async () => {
    const user = setup();
    renderLog({ items: some(), total: 60 });

    await user.type(searchBox(), "phy");
    await elapse(SEARCH_DEBOUNCE_MS - 50);
    await user.type(searchBox(), "sio");
    await elapse(SEARCH_DEBOUNCE_MS);

    expect(replace).toHaveBeenCalledExactlyOnceWith("/family/client-margaret/tasks?q=physio", {
      scroll: false,
    });
  });

  it("[FAM-UI-07][AC-07] pressing Enter searches at once and the pause that follows does not search a second time", async () => {
    const user = setup();
    renderLog({ items: some(), total: 60 });

    await user.type(searchBox(), "walk{Enter}");
    expect(replace).toHaveBeenCalledExactlyOnceWith("/family/client-margaret/tasks?q=walk", {
      scroll: false,
    });

    await elapse(SEARCH_DEBOUNCE_MS * 3);
    expect(replace).toHaveBeenCalledOnce();
  });

  it("[FAM-UI-07][AC-07] the Clear search button empties the box and removes q from the URL at once", async () => {
    const user = userEvent.setup();
    renderLog({ items: some(), total: 60, params: { q: "walk", status: "done", page: 1 } });

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(searchBox()).toHaveValue("");
    expect(replace).toHaveBeenCalledExactlyOnceWith("/family/client-margaret/tasks?status=done", {
      scroll: false,
    });
  });

  it("[FAM-UI-07][AC-07] the search box shows the URL's q on load and follows it when the URL changes (Back, Forward, a shared link)", () => {
    const view = renderLog({ items: some(), total: 60, params: { q: "physio", page: 1 } });
    expect(searchBox()).toHaveValue("physio");

    view.rerenderWith({ params: { q: "walk", page: 1 } });
    expect(searchBox()).toHaveValue("walk");

    view.rerenderWith({ params: { q: "", page: 1 } });
    expect(searchBox()).toHaveValue("");
  });

  it("[FAM-UI-07][AC-07] the URL arriving with the search someone already typed does not overwrite words they typed since", async () => {
    const user = setup();
    const view = renderLog({ items: some(), total: 60 });

    await user.type(searchBox(), "phys");
    await elapse(SEARCH_DEBOUNCE_MS);
    expect(replace).toHaveBeenCalledOnce();

    await user.type(searchBox(), "i");
    view.rerenderWith({ params: { q: "phys", page: 1 } });

    expect(searchBox()).toHaveValue("physi");
    await elapse(SEARCH_DEBOUNCE_MS);
    expect(replace).toHaveBeenLastCalledWith("/family/client-margaret/tasks?q=physi", {
      scroll: false,
    });
  });

  it("[FAM-UI-07][AC-07] a Back or Forward to another search cancels a search that was still waiting to be sent", async () => {
    const user = setup();
    const view = renderLog({ items: some(), total: 60, params: { q: "physio", page: 1 } });

    await user.type(searchBox(), " walk");
    view.rerenderWith({ params: { q: "medication", page: 1 } });
    await elapse(SEARCH_DEBOUNCE_MS * 2);

    expect(searchBox()).toHaveValue("medication");
    expect(replace).not.toHaveBeenCalled();
  });

  it("[FAM-UI-07][AC-07] changing Status while a search is still waiting sends both together, once", async () => {
    const user = setup();
    renderLog({ items: some(), total: 60 });

    await user.type(searchBox(), "walk");
    await user.selectOptions(statusSelect(), "Done");
    await elapse(SEARCH_DEBOUNCE_MS * 2);

    expect(replace).toHaveBeenCalledExactlyOnceWith(
      "/family/client-margaret/tasks?q=walk&status=done",
      { scroll: false },
    );
  });

  it("[FAM-UI-07][AC-07] does not navigate for spaces alone, or for text that gives the search already in the URL", async () => {
    const user = setup();
    renderLog({ items: some(), total: 60, params: { q: "walk", page: 4 } });

    await user.type(searchBox(), "   ");
    await user.type(searchBox(), " ");
    await user.clear(searchBox());
    await user.type(searchBox(), "  walk  ");
    await elapse(SEARCH_DEBOUNCE_MS * 2);

    expect(replace).not.toHaveBeenCalled();
  });

  it("[FAM-UI-07][AC-07] leaving the screen cancels a search that was still waiting", async () => {
    const user = setup();
    const view = renderLog({ items: some(), total: 60 });

    await user.type(searchBox(), "walk");
    view.unmount();
    await elapse(SEARCH_DEBOUNCE_MS * 2);

    expect(replace).not.toHaveBeenCalled();
  });

  it("[FAM-UI-07][AC-06] the box holds at most 200 characters, so pasting 5,000 sends 200", async () => {
    const user = setup();
    renderLog({ items: some(), total: 60 });

    await user.click(searchBox());
    await user.paste("a".repeat(5000));
    await elapse(SEARCH_DEBOUNCE_MS);

    expect((searchBox() as HTMLInputElement).value).toHaveLength(200);
    const href = replace.mock.calls[0]![0] as string;
    expect(href.split("q=")[1]).toHaveLength(200);
  });

  it("[FAM-UI-07][AC-07] the search field sits in a labelled search landmark", () => {
    renderLog({ items: some(), total: 60 });

    expect(
      within(screen.getByRole("search", { name: "Search tasks" })).getByPlaceholderText(
        "Search tasks",
      ),
    ).toBe(searchBox());
  });
});

describe("[FAM-UI-07] TaskLogView: paging and states for any amount of data (generated rows)", () => {
  const history = makeHistory(537);

  it("[FAM-UI-07][AC-05] page 2 of a 137-row log shows 'Showing 21-40 of 137', Previous and Next, and links to every page it can reach", () => {
    renderLog({
      items: makeHistory(137).slice(20, 40),
      total: 137,
      params: { q: "", page: 2 },
    });

    const nav = screen.getByRole("navigation", { name: "Task log pages" });
    expect(within(nav).getByText("Showing 21-40 of 137")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Previous" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Next" })).toBeInTheDocument();
    expect(dataRows()).toHaveLength(20);
  });

  it("[FAM-UI-07][AC-05] the last page of 537 rows holds the 17 remaining rows and reads 'Showing 521-537 of 537'", () => {
    renderLog({ items: history.slice(520), total: 537, params: { q: "", page: 27 } });

    expect(dataRows()).toHaveLength(17);
    expect(screen.getByText("Showing 521-537 of 537")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] exactly one page (20 rows) has no pager; one row over (21) does", () => {
    const one = renderLog({ items: history.slice(0, 20), total: 20 });
    expect(dataRows()).toHaveLength(20);
    expect(screen.queryByRole("navigation", { name: "Task log pages" })).not.toBeInTheDocument();
    one.unmount();

    renderLog({ items: history.slice(0, 20), total: 21 });
    expect(screen.getByText("Showing 1-20 of 21")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the empty state, and no table or pager, when the client has no tasks at all", () => {
    renderLog({ items: [], total: 0 });

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Task log pages" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows a no-tasks-found state when the Status filter alone matches nothing", () => {
    renderLog({ items: [], total: 0, params: { q: "", status: "overdue", page: 1 } });

    expect(screen.getByText("No tasks found")).toBeInTheDocument();
    expect(screen.queryByText(/No matches for/)).not.toBeInTheDocument();
    expect(screen.queryByText("No tasks yet")).not.toBeInTheDocument();
    expect(statusSelect()).toHaveDisplayValue("Overdue");
  });

  it("[FAM-UI-07][PRD] tells assistive technology which tasks are shown, and when there are none", () => {
    const view = renderLog({
      items: history.slice(20, 40),
      total: 537,
      params: { q: "", page: 2 },
    });
    expect(screen.getByRole("status")).toHaveTextContent("Showing 21-40 of 537 tasks");

    view.rerenderWith({ items: [], total: 0, params: { q: "zzz", page: 1 } });
    expect(screen.getByRole("status")).toHaveTextContent("No tasks to show");
  });

  it("[FAM-UI-07][PRD] renders 120-character titles, 60-character names and non-ASCII text in full", () => {
    const rows = history.filter(
      (item) =>
        item.title === TITLE_120 ||
        NON_ASCII_TITLES.includes(item.title) ||
        item.actor === NAME_60 ||
        item.assignee === NAME_60,
    );
    expect(rows.length).toBeGreaterThan(10);
    renderLog({ items: rows.slice(0, 20), total: rows.length });

    for (const item of rows.slice(0, 20)) {
      expect(screen.getAllByRole("link", { name: item.title }).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByRole("link", { name: TITLE_120 }).length).toBeGreaterThan(0);
    expect(screen.getAllByTitle(NAME_60).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "朝の投薬の確認" }).length).toBeGreaterThan(0);
  });
});

describe("[FAM-UI-07] TaskLogView: links keep the view (AC-08)", () => {
  it("[FAM-UI-07][AC-08] each task links to its detail carrying the validated q, status and page, and clicking the row goes there too", async () => {
    const user = userEvent.setup();
    const params: TaskLogParams = { q: "phys", status: "done", page: 3 };
    const items = makeHistory(60).slice(40, 60);
    renderLog({ items, total: 60, params });

    const href = taskDetailHref(ID, items[0]!.key, params);
    expect(href).toContain("?q=phys&status=done&page=3");
    const first = dataRows()[0]!;
    expect(within(first).getByRole("link")).toHaveAttribute("href", href);

    await user.click(within(first).getByText(cellTexts(first)[2]!, { selector: "span" }));
    expect(push).toHaveBeenCalledExactlyOnceWith(href);
  });

  it("[FAM-UI-07][AC-08] a plain first page links to the plain detail route, with no query string", () => {
    const items = makeHistory(20);
    renderLog({ items, total: 20 });

    expect(within(dataRows()[0]!).getByRole("link")).toHaveAttribute(
      "href",
      taskDetailHref(ID, items[0]!.key),
    );
  });

  it("[FAM-UI-07][PRD] clicking the task link does not also trigger the row's own navigation", async () => {
    const user = userEvent.setup();
    const { container } = renderLog({ items: makeHistory(5) });
    // jsdom cannot navigate; cancel the link's default action so it does not log noise.
    // (On the container, not the document: the link stops the click from bubbling that far.)
    container.addEventListener("click", (event) => event.preventDefault(), { once: true });

    await user.click(within(dataRows()[0]!).getByRole("link"));

    expect(push).not.toHaveBeenCalled();
  });

  it("[FAM-UI-07][PRD] sizes the task link to its text, so its focus ring does not span the whole column", () => {
    renderLog({ items: makeHistory(3) });

    expect(within(dataRows()[0]!).getByRole("link")).toHaveClass("w-fit");
  });

  it("[FAM-UI-07][PRD] keeps a nurse name on one line, so every row stays 50px, and exposes the full name on hover", () => {
    const items = makeHistory(3);
    renderLog({ items });

    const nurse = within(dataRows()[0]!).getByTitle(items[0]!.actor!);

    expect(nurse).toHaveClass("truncate");
  });

  it("[FAM-UI-07][PRD] has no axe violations with results and a pager, and with none", async () => {
    const view = renderLog({
      items: makeHistory(137).slice(20, 40),
      total: 137,
      params: { q: "", page: 2 },
    });
    expect(await axe(view.container)).toHaveNoViolations();
    view.unmount();

    const empty = renderLog({ items: [], total: 0, params: { q: "Zoe", page: 1 } });
    expect(await axe(empty.container)).toHaveNoViolations();
  });
});
