import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { TaskLogPager } from "./task-log-pager";

const ID = "client-margaret";

function renderPager(
  page: number,
  total: number,
  extra: { q?: string; status?: "done" | "planned" | "overdue" } = {},
) {
  return render(
    <TaskLogPager
      clientId={ID}
      params={{ q: extra.q ?? "", status: extra.status, page }}
      total={total}
      pageSize={20}
    />,
  );
}

const nav = () => screen.getByRole("navigation", { name: "Task log pages" });

describe("TaskLogPager (CHG-005)", () => {
  it("[FAM-UI-07][AC-05] shows 'Showing 21-40 of 137', Previous, Next and the current page on page 2 of 137", () => {
    renderPager(2, 137);

    expect(within(nav()).getByText("Showing 21-40 of 137")).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
    expect(within(nav()).getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?page=3",
    );
    expect(within(nav()).getByText("2")).toHaveAttribute("aria-current", "page");
  });

  it("[FAM-UI-07][AC-05] indicates exactly one current page and makes every other page number a link", () => {
    const { container } = renderPager(2, 137);

    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    for (const n of [1, 3, 4, 5, 6, 7]) {
      expect(within(nav()).getByRole("link", { name: `Page ${n}` })).toHaveAttribute(
        "href",
        n === 1 ? "/family/client-margaret/tasks" : `/family/client-margaret/tasks?page=${n}`,
      );
    }
    expect(within(nav()).queryByRole("link", { name: "Page 2" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] the first page has no Previous and the last page has no Next", () => {
    const first = renderPager(1, 137);
    expect(within(nav()).queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Next" })).toBeInTheDocument();
    expect(within(nav()).getByText("Showing 1-20 of 137")).toBeInTheDocument();
    first.unmount();

    renderPager(7, 137);
    expect(within(nav()).queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?page=6",
    );
    expect(within(nav()).getByText("Showing 121-137 of 137")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] a 537-row log has 27 pages, reachable with a gap-limited window and a link to the last page", () => {
    renderPager(14, 537);

    expect(within(nav()).getByText("Showing 261-280 of 537")).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Page 27" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?page=27",
    );
    expect(within(nav()).getByRole("link", { name: "Page 13" })).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Page 15" })).toBeInTheDocument();
    expect(within(nav()).queryByRole("link", { name: "Page 8" })).not.toBeInTheDocument();
    expect(within(nav()).getAllByText("…")).toHaveLength(2);
  });

  it("[FAM-UI-07][AC-05] a last page holding one row says 'Showing 21 of 21', not a one-number range", () => {
    renderPager(2, 21);

    expect(within(nav()).getByText("Showing 21 of 21")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] the last page of 537 shows the 17 remaining rows in its summary", () => {
    renderPager(27, 537);

    expect(within(nav()).getByText("Showing 521-537 of 537")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-05] exactly one page, and a page-size-and-one, decide whether a pager appears at all", () => {
    for (const total of [0, 1, 9, 19, 20]) {
      const { container, unmount } = renderPager(1, total);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }

    renderPager(1, 21);
    expect(within(nav()).getByText("Showing 1-20 of 21")).toBeInTheDocument();
    expect(within(nav()).getByRole("link", { name: "Page 2" })).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-08] every link carries the validated q and status so paging never loses the search", () => {
    renderPager(3, 537, { q: "physio & walk", status: "done" });

    expect(within(nav()).getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?q=physio+%26+walk&status=done&page=4",
    );
    expect(within(nav()).getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?q=physio+%26+walk&status=done&page=2",
    );
    expect(within(nav()).getByRole("link", { name: "Page 1" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?q=physio+%26+walk&status=done",
    );
  });

  it("[FAM-UI-07][AC-05] every pager control is at least 44px by 44px", () => {
    renderPager(14, 537);

    for (const link of within(nav()).getAllByRole("link")) {
      expect(link).toHaveClass("h-11");
      expect(link).toHaveClass("min-w-11");
    }
  });

  it("[FAM-UI-07][AC-05] Previous and Next say where they go in the page's link relations", () => {
    renderPager(2, 137);

    expect(within(nav()).getByRole("link", { name: "Previous" })).toHaveAttribute("rel", "prev");
    expect(within(nav()).getByRole("link", { name: "Next" })).toHaveAttribute("rel", "next");
  });

  it("[FAM-UI-07][AC-05] has no axe violations, on a middle page and on the last", async () => {
    const middle = renderPager(14, 537);
    expect(await axe(middle.container)).toHaveNoViolations();
    middle.unmount();

    const last = renderPager(27, 537);
    expect(await axe(last.container)).toHaveNoViolations();
  });
});
