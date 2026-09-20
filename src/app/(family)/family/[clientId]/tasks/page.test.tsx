import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { taskDetailHref } from "@/features/family-task-log/task-routes";
import { getTaskLog } from "@/server/events/queries";

import TasksPage from "./page";

const ID = "client-margaret";

type SearchParams = Record<string, string | string[] | undefined>;

function props(clientId: string, searchParams: SearchParams = {}) {
  return {
    params: Promise.resolve({ clientId }),
    searchParams: Promise.resolve(searchParams),
  };
}

async function renderPage(clientId = ID, searchParams: SearchParams = {}) {
  return render(await TasksPage(props(clientId, searchParams)));
}

const dataRows = () => screen.queryAllByRole("row").slice(1);
const rowKeys = () => dataRows().map((row) => within(row).getByRole("link").getAttribute("href")!);
const nav = () => screen.getByRole("navigation", { name: "Task log pages" });

/** The redirect a page throws, as Next reports it: `NEXT_REDIRECT;replace;<url>;307;`. */
async function redirectTarget(searchParams: SearchParams, clientId = ID): Promise<string> {
  try {
    render(await TasksPage(props(clientId, searchParams)));
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? "";
    expect(digest).toMatch(/^NEXT_REDIRECT;replace;/);
    return digest.split(";")[2]!;
  }
  throw new Error("expected the page to redirect");
}

describe("[FAM-UI-07] /family/[clientId]/tasks page (real mock contract, DATA_SOURCE=mock)", () => {
  it("[FAM-UI-07][AC-01] renders page 1 of Margaret's log: 20 rows, newest first, Afternoon check-in then Physiotherapy then Morning medication on Mon 30 Nov", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Task log" })).toBeInTheDocument();
    expect(dataRows()).toHaveLength(20);
    const firstThree = dataRows()
      .slice(0, 3)
      .map((row) =>
        within(row)
          .getAllByRole("cell")
          .slice(0, 4)
          .map((cell) => cell.textContent),
      );
    expect(firstThree).toEqual([
      ["Mon 30 Nov", "Afternoon check-in", "Aisha Rahman", "Planned"],
      ["Mon 30 Nov", "Physiotherapy", "Aisha Rahman", "Planned"],
      ["Mon 30 Nov", "Morning medication", "Aisha Rahman", "Done · Aisha Rahman"],
    ]);
  });

  it("[FAM-UI-07][AC-05] shows 'Showing 1-20 of 137' with Next and no Previous on the first page", async () => {
    await renderPage();

    expect(within(nav()).getByText("Showing 1-20 of 137")).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?page=2",
    );
    expect(within(nav()).queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] page 2 shows the contract's rows 21-40 with Previous and Next", async () => {
    const expected = await getTaskLog(ID, { page: 2 });

    await renderPage(ID, { page: "2" });

    expect(rowKeys()).toEqual(
      expected.items.map((item) => taskDetailHref(ID, item.key, { q: "", page: 2 })),
    );
    expect(within(nav()).getByText("Showing 21-40 of 137")).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Previous" })).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Next" })).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] the last page holds the remaining 17 rows and has no Next", async () => {
    await renderPage(ID, { page: "7" });

    expect(dataRows()).toHaveLength(17);
    expect(within(nav()).getByText("Showing 121-137 of 137")).toBeInTheDocument();
    expect(within(nav()).queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] paging from 1 to 7 reaches all 137 tasks exactly once: nothing is cut off", async () => {
    const seen: string[] = [];
    for (let page = 1; page <= 7; page += 1) {
      const view = await renderPage(ID, { page: String(page) });
      seen.push(
        ...rowKeys().map((href) => decodeURIComponent(href.split("?")[0]!.split("/tasks/")[1]!)),
      );
      view.unmount();
    }

    const everything = (
      await Promise.all(
        [1, 2, 3, 4, 5, 6, 7].map((page) =>
          getTaskLog(ID, { page }).then((result) => result.items),
        ),
      )
    ).flat();
    expect(seen).toHaveLength(137);
    expect(new Set(seen).size).toBe(137);
    expect(seen).toEqual(everything.map((item) => item.key));
  });

  it("[FAM-UI-07][AC-02] ?status=overdue shows only Weekly weigh-in and Medication review, each with nurse '—'", async () => {
    await renderPage(ID, { status: "overdue" });

    const rows = dataRows().map((row) =>
      within(row)
        .getAllByRole("cell")
        .slice(1, 3)
        .map((cell) => cell.textContent),
    );
    expect(rows).toEqual([
      ["Weekly weigh-in", "—"],
      ["Medication review", "—"],
    ]);
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("Overdue");
    expect(screen.queryByRole("navigation", { name: "Task log pages" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-03] ?q=Zoe shows 'No matches for \"Zoe\".' after searching the whole history", async () => {
    await renderPage(ID, { q: "Zoe" });

    expect(screen.getByText('No matches for "Zoe".')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search tasks")).toHaveValue("Zoe");
    expect(dataRows()).toHaveLength(0);
  });

  it("[FAM-UI-07][AC-07] q, status and page combine: only Done medication rows, paged, with the search kept in every link", async () => {
    const expected = await getTaskLog(ID, { q: "medication", status: "done", page: 2 });
    expect(expected.total).toBeGreaterThan(20);

    await renderPage(ID, { q: "medication", status: "done", page: "2" });

    expect(dataRows()).toHaveLength(expected.items.length);
    expect(
      within(nav()).getByText(`Showing 21-${20 + expected.items.length} of ${expected.total}`),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search tasks")).toHaveValue("medication");
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("Done");
    expect(within(nav()).getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?q=medication&status=done",
    );
  });

  it("[FAM-UI-07][AC-08] every task link carries the current q, status and page", async () => {
    await renderPage(ID, { q: "medication", status: "done", page: "2" });

    for (const href of rowKeys()) {
      expect(href.endsWith("?q=medication&status=done&page=2")).toBe(true);
    }
  });

  it("[FAM-UI-07][PRD] shows only the client's own tasks: Robert has 3, on one page", async () => {
    await renderPage("client-robert");

    expect(dataRows()).toHaveLength(3);
    expect(screen.queryByRole("navigation", { name: "Task log pages" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the empty state for a client the contract has no tasks for", async () => {
    await renderPage("client-nobody-knows");

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] a client id that is a JavaScript built-in name is just an unknown client", async () => {
    await renderPage("constructor");

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
  });
});

describe("[FAM-UI-07] /family/[clientId]/tasks page: invalid and hostile URLs never error (AC-06)", () => {
  it.each(["0", "-3", "abc", "1.5", "1e3", "", "NaN", "Infinity", "+2"])(
    "[FAM-UI-07][AC-06] ?page=%j shows page 1",
    async (page) => {
      await renderPage(ID, { page });

      expect(dataRows()).toHaveLength(20);
      expect(within(nav()).getByText("Showing 1-20 of 137")).toBeInTheDocument();
    },
  );

  it("[FAM-UI-07][AC-06] ?page=99999 goes to the last page (7), replacing the URL", async () => {
    expect(await redirectTarget({ page: "99999" })).toBe("/family/client-margaret/tasks?page=7");
  });

  it("[FAM-UI-07][AC-06] a page past the end keeps the search and Status when it goes to the last page", async () => {
    const { total } = await getTaskLog(ID, { q: "medication", status: "done" });
    const last = Math.ceil(total / 20);

    expect(await redirectTarget({ q: "medication", status: "done", page: "50" })).toBe(
      `/family/client-margaret/tasks?q=medication&status=done&page=${last}`,
    );
  });

  it("[FAM-UI-07][AC-06] a page past the end of a search with no matches goes to page 1 of it, not to page 0", async () => {
    expect(await redirectTarget({ q: "Zoe", page: "4" })).toBe(
      "/family/client-margaret/tasks?q=Zoe",
    );
  });

  it("[FAM-UI-07][AC-06] ?status=bogus shows every status", async () => {
    await renderPage(ID, { status: "bogus" });

    expect(screen.getByLabelText("Status")).toHaveDisplayValue("All statuses");
    expect(within(nav()).getByText("Showing 1-20 of 137")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-06] a 5,000-character q is capped at 200 characters and does not error", async () => {
    await renderPage(ID, { q: "a".repeat(5000) });

    expect(screen.getByPlaceholderText("Search tasks")).toHaveValue("a".repeat(200));
    expect(screen.getByText(`No matches for "${"a".repeat(200)}".`)).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-06] repeated params use the first value", async () => {
    await renderPage(ID, { status: ["overdue", "done"], page: ["1", "9"] });

    expect(dataRows()).toHaveLength(2);
  });

  it("[FAM-UI-07][AC-06] markup and control characters in q are shown as text and never run", async () => {
    const { container } = await renderPage(ID, { q: '<img src=x onerror="alert(1)">\u0000' });

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByPlaceholderText("Search tasks")).toHaveValue(
      '<img src=x onerror="alert(1)">',
    );
  });
});
