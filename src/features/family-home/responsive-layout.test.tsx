import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FamilyHomeView } from "./family-home-view";
import {
  CLIENT_ID,
  LONG_LABEL,
  LONG_NAME,
  LONG_TITLE,
  UNBROKEN_LABEL,
  bucket,
  denseDay,
  melbourne,
  occurrence,
  overdueNewestFirst,
} from "./test-support";

import type { FamilyHomeData } from "./home-data";

/**
 * jsdom has no layout, so these check the causes of a broken layout, not the
 * layout: everything that holds a long value is allowed to shrink, everything
 * that is cut off says so in a `title`, and the columns stack under 1280px.
 * The layout itself is checked in a real browser (PROGRESS.md, width sweep).
 */
const LONG_ROW = occurrence({
  title: LONG_TITLE,
  start: melbourne("16:30", "2026-11-25"),
  status: "done",
  actor: LONG_NAME,
  assignee: LONG_NAME,
});

const DATA: FamilyHomeData = {
  today: [LONG_ROW, ...denseDay(32)].map((row, index) =>
    index === 0 ? { ...row, start: melbourne("10:00") } : row,
  ),
  overdue: { items: overdueNewestFirst(5).reverse(), total: 40 },
  recent: [LONG_ROW],
  budget: [
    bucket(LONG_LABEL, 1234567.89, 34567.89),
    bucket(UNBROKEN_LABEL, 5000, 5400),
    ...Array.from({ length: 6 }, (_, index) => bucket(`Funding ${index + 1}`, 10000, 2000)),
  ],
};

function renderHome() {
  return render(
    <FamilyHomeView clientId={CLIENT_ID} data={DATA} today={new Date(melbourne("09:00"))} />,
  );
}

describe("[FAM-UI-01][PRD] Home layout adapts to the width", () => {
  it("[FAM-UI-01][PRD] is one column, then two columns from 768px, then the design's 340px column from 1280px", () => {
    const { container } = renderHome();
    const grid = container.querySelector(".grid")!;

    expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2");
    expect(grid.className).toContain("xl:grid-cols-[minmax(0,1fr)_340px]");
  });

  it("[FAM-UI-01][PRD] every grid item may shrink below its content, so no long value can widen the page", () => {
    const { container } = renderHome();
    const grid = container.querySelector(".grid")!;

    expect(container.firstElementChild).toHaveClass("min-w-0");
    expect(grid).toHaveClass("min-w-0");
    for (const item of Array.from(grid.children)) expect(item).toHaveClass("min-w-0");
    for (const tile of within(screen.getByRole("region", { name: "Budget" })).getAllByRole(
      "listitem",
    )) {
      expect(tile).toHaveClass("min-w-0");
    }
  });

  it("[FAM-UI-01][PRD] every piece of text that can be cut off has its full text in a title attribute", () => {
    const { container } = renderHome();
    const cut = container.querySelectorAll(".truncate, [class*='line-clamp-']");

    expect(cut.length).toBeGreaterThan(0);
    for (const element of Array.from(cut)) {
      const holder = element.closest("[title]");
      expect(holder, element.textContent ?? "").not.toBeNull();
      expect(holder!.getAttribute("title")).toBeTruthy();
    }
  });

  it("[FAM-UI-01][PRD] a status pill keeps its size and its label is what gives way", () => {
    renderHome();

    for (const region of ["Overdue", "Recent activity"]) {
      const card = screen.getByRole("region", { name: region });
      for (const pill of within(card).getAllByTitle(/^(Overdue|Done · .*)$/)) {
        expect(pill).toHaveClass("shrink-0", "min-w-0");
        expect(pill.className).toMatch(/max-w-\[\d+%\]/);
      }
    }
  });

  it("[FAM-UI-01][PRD] a Today row is clipped to its own box and never paints over the row beside it", () => {
    renderHome();
    const rows = within(screen.getByRole("list", { name: "Care events today" })).getAllByRole(
      "link",
    );

    expect(rows.length).toBe(33);
    for (const row of rows) expect(row).toHaveClass("overflow-hidden");
  });

  it("[FAM-UI-01][PRD] the budget cards flow into as many columns as fit, never a fixed three", () => {
    renderHome();
    const grid = within(screen.getByRole("region", { name: "Budget" })).getAllByRole("list")[0]!;

    expect(grid.className).toContain("grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))]");
  });
});
