import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { Occurrence } from "@/types/domain";

import { OverdueCard } from "./overdue-card";
import { RecentActivityCard } from "./recent-activity-card";
import {
  CLIENT_ID,
  LONG_NAME,
  LONG_TITLE,
  NON_ASCII_NAME,
  NON_ASCII_TITLE,
  melbourne,
  occurrence,
  overdueNewestFirst,
} from "./test-support";

/** The 102-character title and 51-character carer name in the mock data (UI-04 FD-08). */
const MOCK_TITLE =
  "Administer prescribed eye drops to both eyes, check for redness or discharge, and record it in the log";
const MOCK_CARER = "Anastasia Wilhelmina Konstantinopoulos-Featherstone";

const WOUND = occurrence({
  title: "Wound dressing check",
  start: melbourne("10:00", "2026-11-27"),
  status: "overdue",
});
const REVIEW = occurrence({
  title: "Medication review",
  start: melbourne("08:00", "2026-11-28"),
  status: "overdue",
});
const WEIGH_IN = occurrence({
  title: "Weekly weigh-in",
  start: melbourne("10:00", "2026-11-29"),
  status: "overdue",
});

function renderOverdue(items: Occurrence[], total = items.length) {
  render(<OverdueCard clientId={CLIENT_ID} occurrences={items} total={total} />);
  return screen.getByRole("region", { name: "Overdue" });
}

function renderRecent(items: Occurrence[]) {
  render(<RecentActivityCard clientId={CLIENT_ID} occurrences={items} />);
  return screen.getByRole("region", { name: "Recent activity" });
}

describe("[FAM-UI-01][AC-02] Overdue card", () => {
  it("[FAM-UI-01][AC-02] badge is 3 and lists the three items, oldest first, for a contract that reports three (design data)", () => {
    const card = renderOverdue([WOUND, REVIEW, WEIGH_IN], 3);

    expect(within(card).getByText("3")).toBeInTheDocument();
    const rows = within(card).getAllByRole("listitem");
    expect(rows.map((row) => row.querySelector("p")?.textContent)).toEqual([
      "Wound dressing check",
      "Medication review",
      "Weekly weigh-in",
    ]);
    expect(within(rows[0]!).getByText("Fri 27 Nov")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Sat 28 Nov")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("Sun 29 Nov")).toBeInTheDocument();
    for (const row of rows) expect(within(row).getByText("Overdue")).toBeInTheDocument();
  });

  it("[FAM-UI-01][AC-02] badge follows the contract's total, so two overdue items read 2, as the mock data does", () => {
    const card = renderOverdue([REVIEW, WEIGH_IN], 2);

    expect(within(card).getByText("2")).toBeInTheDocument();
    expect(within(card).getAllByRole("listitem")).toHaveLength(2);
  });

  it("[FAM-UI-01][AC-02] with 40 overdue the badge reads 40, five rows show, and all 40 are one click away", () => {
    const newestFive = overdueNewestFirst(5).reverse();
    const card = renderOverdue(newestFive, 40);

    expect(within(card).getByText("40")).toBeInTheDocument();
    expect(within(card).getAllByRole("listitem")).toHaveLength(5);
    const viewAll = within(card).getByRole("link", { name: /View all 40 overdue/ });
    expect(viewAll).toHaveAttribute("href", "/family/client-margaret/tasks?status=overdue");
  });

  it("[FAM-UI-01][AC-02] offers no 'View all' when every overdue item is already listed", () => {
    const card = renderOverdue([WOUND, REVIEW, WEIGH_IN], 3);

    expect(within(card).queryByRole("link", { name: /View all/ })).not.toBeInTheDocument();
  });

  it("[FAM-UI-01][AC-02] offers 'View all' for six overdue even though five rows show", () => {
    const card = renderOverdue(overdueNewestFirst(5).reverse(), 6);

    expect(within(card).getByRole("link", { name: /View all 6 overdue/ })).toBeInTheDocument();
  });

  it("[FAM-UI-01][Scope] each row is a link to that occurrence's task detail, with the key encoded", () => {
    const card = renderOverdue([WOUND, REVIEW, WEIGH_IN]);

    expect(within(card).getByRole("link", { name: /Wound dressing check/ })).toHaveAttribute(
      "href",
      `/family/client-margaret/tasks/${encodeURIComponent(WOUND.key)}`,
    );
  });

  it("[FAM-UI-01][PRD] a 120-character title wraps to two lines then an ellipsis, with the full title on hover, and the pill keeps its size", () => {
    expect(LONG_TITLE).toHaveLength(120);
    const card = renderOverdue([
      occurrence({ title: LONG_TITLE, start: melbourne("10:00", "2026-11-27"), status: "overdue" }),
    ]);

    const title = within(card).getByText(LONG_TITLE);
    expect(title).toHaveClass("line-clamp-2", "break-words");
    expect(title).toHaveAttribute("title", LONG_TITLE);
    expect(within(card).getByTitle("Overdue")).toHaveClass("shrink-0");
  });

  it("[FAM-UI-01][AC-05] says 'All caught up' when nothing is overdue", () => {
    const card = renderOverdue([], 0);

    expect(within(card).getByText("All caught up")).toBeInTheDocument();
    expect(within(card).queryByRole("link")).not.toBeInTheDocument();
  });

  it("[FAM-UI-01][PRD] has no axe violations with forty overdue", async () => {
    const { container } = render(
      <OverdueCard clientId={CLIENT_ID} occurrences={overdueNewestFirst(5).reverse()} total={40} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[FAM-UI-01][PRD] Recent activity rows with long and awkward text", () => {
  const LONG_ROW = occurrence({
    title: MOCK_TITLE,
    start: melbourne("16:30", "2026-11-25"),
    status: "done",
    actor: MOCK_CARER,
  });

  it("[FAM-UI-01][PRD] the mock data's 102-character title wraps to two lines then an ellipsis, with the full title on hover", () => {
    expect(MOCK_TITLE).toHaveLength(102);
    const card = renderRecent([LONG_ROW]);

    const title = within(card).getByText(MOCK_TITLE);
    expect(title).toHaveClass("line-clamp-2", "break-words");
    expect(title).not.toHaveClass("truncate");
    expect(title).toHaveAttribute("title", MOCK_TITLE);
  });

  it("[FAM-UI-01][PRD] the 51-character carer name truncates on one line inside a pill that is never squeezed, full name on hover", () => {
    expect(MOCK_CARER).toHaveLength(51);
    const card = renderRecent([LONG_ROW]);

    const pill = within(card).getByTitle(`Done · ${MOCK_CARER}`);
    expect(pill).toHaveClass("shrink-0");
    expect(pill.className).toMatch(/max-w-\[/);
    // The kit's pill truncates its own text on one line.
    expect(within(pill).getByText(`Done · ${MOCK_CARER}`)).toHaveClass("truncate");
  });

  it("[FAM-UI-01][PRD] a 120-character title and a 60-character name are handled the same way", () => {
    const card = renderRecent([
      occurrence({
        title: LONG_TITLE,
        start: melbourne("09:00"),
        status: "done",
        actor: LONG_NAME,
      }),
    ]);

    expect(within(card).getByText(LONG_TITLE)).toHaveClass("line-clamp-2");
    expect(within(card).getByTitle(`Done · ${LONG_NAME}`)).toHaveClass("shrink-0");
  });

  it("[FAM-UI-01][PRD] shows non-ASCII titles and names intact", () => {
    const card = renderRecent([
      occurrence({
        title: NON_ASCII_TITLE,
        start: melbourne("09:00"),
        status: "done",
        actor: NON_ASCII_NAME,
      }),
    ]);

    expect(within(card).getByText(NON_ASCII_TITLE)).toBeInTheDocument();
    expect(within(card).getByText(`Done · ${NON_ASCII_NAME}`)).toBeInTheDocument();
  });

  it("[FAM-UI-01][Scope] each row is a link, so it opens in a new tab, and its name has the whole title and carer", () => {
    const card = renderRecent([LONG_ROW]);

    const row = within(card).getByRole("link", { name: new RegExp(MOCK_CARER) });
    expect(row).toHaveAttribute(
      "href",
      `/family/client-margaret/tasks/${encodeURIComponent(LONG_ROW.key)}`,
    );
    expect(row).toHaveAccessibleName(new RegExp(MOCK_TITLE));
  });

  it("[FAM-UI-01][PRD] shows a Done row without an actor as 'Done · —', never 'undefined'", () => {
    const card = renderRecent([
      occurrence({ title: "Morning medication", start: melbourne("09:00"), status: "done" }),
    ]);

    expect(within(card).getByText("Done · —")).toBeInTheDocument();
    expect(card.textContent).not.toMatch(/undefined/);
  });

  it("[FAM-UI-01][AC-04] 'View all' targets the whole Task log", () => {
    const card = renderRecent([LONG_ROW]);

    expect(within(card).getByRole("link", { name: "View all" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-01][PRD] has no axe violations with long text", async () => {
    const { container } = render(
      <RecentActivityCard clientId={CLIENT_ID} occurrences={[LONG_ROW]} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
