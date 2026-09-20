import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { Occurrence } from "@/types/domain";

import {
  CLIENT_ID,
  LONG_NAME,
  LONG_TITLE,
  NON_ASCII_NAME,
  NON_ASCII_TITLE,
  denseDay,
  melbourne,
  occurrence,
} from "./test-support";
import { TodayTimeline } from "./today-timeline";

const MORNING = occurrence({
  title: "Morning medication",
  start: melbourne("09:00"),
  durationMinutes: 60,
  status: "done",
  actor: "Aisha Rahman",
  assignee: "Aisha Rahman",
});
const PHYSIOTHERAPY = occurrence({
  title: "Physiotherapy",
  start: melbourne("11:30"),
  durationMinutes: 90,
  status: "planned",
  assignee: "Aisha Rahman",
});
const CHECK_IN = occurrence({
  title: "Afternoon check-in",
  start: melbourne("15:00"),
  durationMinutes: 60,
  status: "planned",
  assignee: "Aisha Rahman",
});
const DESIGN_DAY = [MORNING, PHYSIOTHERAPY, CHECK_IN];

function renderTimeline(occurrences: Occurrence[], now: Date | null = null) {
  return render(<TodayTimeline clientId={CLIENT_ID} occurrences={occurrences} now={now} />);
}

/**
 * True when nothing between `element` and its block hides it. Text that is
 * screen-reader-only, aria-hidden or otherwise not drawn does not count as
 * shown at rest, and neither does anything that needs a hover card.
 */
function isShownAtRest(element: HTMLElement): boolean {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (node.matches(".sr-only, .hidden, .invisible, [hidden], [aria-hidden='true']")) return false;
    if (node.tagName === "A") break;
  }
  return true;
}

describe("[FAM-UI-01][AC-01] Today timeline shows everything at rest", () => {
  it("[FAM-UI-01][AC-01] each block shows its status pill, assignee and duration without hover or focus", () => {
    renderTimeline(DESIGN_DAY);

    const expectations: [RegExp, string[]][] = [
      [/Morning medication/, ["Morning medication", "Aisha Rahman", "1 hr", "Done · Aisha Rahman"]],
      [/Physiotherapy/, ["Physiotherapy", "Aisha Rahman", "1 hr 30 min", "Planned"]],
      [/Afternoon check-in/, ["Afternoon check-in", "Aisha Rahman", "1 hr", "Planned"]],
    ];
    for (const [name, texts] of expectations) {
      const block = screen.getByRole("link", { name });
      for (const text of texts) {
        const shown = within(block).getByText(text);
        expect(isShownAtRest(shown), `"${text}" in ${name}`).toBe(true);
      }
    }
    // Nothing had to be hovered or focused to get here.
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("[FAM-UI-01][AC-01] a block's accessible name carries its time range, title, assignee, duration and status", () => {
    renderTimeline(DESIGN_DAY);

    expect(
      screen.getByRole("link", {
        name: /09:00–10:00.*Morning medication.*Aisha Rahman.*1 hr.*Done · Aisha Rahman/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /11:30–13:00.*Physiotherapy.*1 hr 30 min.*Planned/ }),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-01][AC-01] status is a word and an icon on the pill, not the colour of the block's bar", () => {
    const overdue = occurrence({
      title: "Collect prescription",
      start: melbourne("11:00"),
      durationMinutes: 20,
      status: "overdue",
    });
    renderTimeline([overdue]);
    const block = screen.getByRole("link", { name: /Collect prescription/ });

    expect(within(block).getByText("Overdue")).toBeInTheDocument();
    expect(within(block).getByTestId("icon-alert-triangle")).toBeInTheDocument();
  });

  it("[FAM-UI-01][PRD] shows '—' and says so to screen readers when no carer's shift covers the event", () => {
    const unassigned = occurrence({
      title: "Collect prescription",
      start: melbourne("11:00"),
      status: "planned",
    });
    renderTimeline([unassigned]);

    const block = screen.getByRole("link", { name: /Collect prescription/ });
    expect(within(block).getByText("—")).toBeInTheDocument();
    expect(block).toHaveAccessibleName(/No carer assigned/);
  });

  it("[FAM-UI-01][PRD] each block links to that occurrence's task detail, with the key encoded", () => {
    renderTimeline(DESIGN_DAY);

    expect(screen.getByRole("link", { name: /Morning medication/ })).toHaveAttribute(
      "href",
      `/family/client-margaret/tasks/${encodeURIComponent(MORNING.key)}`,
    );
  });
});

describe("[FAM-UI-01][PRD] Today timeline hours", () => {
  it("[FAM-UI-01][PRD] labels 07:00 to 18:00 for an ordinary day and nothing outside it", () => {
    renderTimeline(DESIGN_DAY);

    for (let hour = 7; hour <= 18; hour += 1) {
      expect(screen.getByText(`${String(hour).padStart(2, "0")}:00`)).toBeInTheDocument();
    }
    expect(screen.queryByText("06:00")).not.toBeInTheDocument();
    expect(screen.queryByText("19:00")).not.toBeInTheDocument();
  });

  it("[FAM-UI-01][PRD] reaches early and late events instead of hiding them below the fold", () => {
    const early = occurrence({
      title: "Early shower",
      start: melbourne("05:30"),
      status: "planned",
    });
    const late = occurrence({
      title: "Settling routine",
      start: melbourne("22:15"),
      status: "planned",
    });
    renderTimeline([early, MORNING, late]);

    expect(screen.getByText("05:00")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Early shower/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settling routine/ })).toBeInTheDocument();
  });

  it("[FAM-UI-01][PRD] an hour in which an event starts reads darker than the hours around it", () => {
    renderTimeline(DESIGN_DAY);

    expect(screen.getByText("09:00")).toHaveClass("text-text-primary");
    expect(screen.getByText("11:00")).toHaveClass("text-text-primary"); // physiotherapy starts 11:30
    expect(screen.getByText("15:00")).toHaveClass("text-text-primary");
    expect(screen.getByText("08:00")).toHaveClass("text-text-secondary");
    expect(screen.getByText("12:00")).toHaveClass("text-text-secondary");
  });

  it("[FAM-UI-01][PRD] draws the current-time line only when now falls inside the hours shown", () => {
    const { unmount } = renderTimeline(DESIGN_DAY, new Date(melbourne("10:30")));
    expect(screen.getByTestId("current-time-line")).toBeInTheDocument();
    unmount();

    const outside = renderTimeline(DESIGN_DAY, new Date(melbourne("22:00")));
    expect(screen.queryByTestId("current-time-line")).not.toBeInTheDocument();
    outside.unmount();

    renderTimeline(DESIGN_DAY, null);
    expect(screen.queryByTestId("current-time-line")).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-01][PRD] Today timeline at volume and with awkward text", () => {
  it("[FAM-UI-01][PRD] keeps all 32 occurrences of a busy, overlapping day, each with its details at rest", () => {
    const day = denseDay(32);
    renderTimeline(day);

    const list = screen.getByRole("list", { name: "Care events today" });
    const blocks = within(list).getAllByRole("link");
    expect(blocks).toHaveLength(32);

    for (const block of blocks) {
      expect(block).toHaveAttribute(
        "href",
        expect.stringContaining("/family/client-margaret/tasks/"),
      );
      expect(block).toHaveTextContent(/Planned|Done · Aisha Rahman|Overdue/);
      expect(block).toHaveTextContent(/\d+ (hr|min)/);
      expect(block).toHaveTextContent(/Aisha Rahman|Sarah Nguyen|—/);
    }
    // Nothing is collapsed behind a "+N more".
    expect(screen.queryByText(/\bmore\b/i)).not.toBeInTheDocument();
  });

  it("[FAM-UI-01][PRD] stacks overlapping occurrences full width, in time order, with no block over another", () => {
    renderTimeline(denseDay(32));
    const items = within(screen.getByRole("list", { name: "Care events today" })).getAllByRole(
      "listitem",
    );

    const boxes = items.map((item) => ({
      top: Number.parseFloat(item.style.top),
      height: Number.parseFloat(item.style.height),
      left: item.style.left,
      right: item.style.right,
    }));
    for (const [index, box] of boxes.entries()) {
      // Every block spans the whole column: nothing is squeezed into a sliver beside another.
      expect(box.left).toBe("0px");
      expect(box.right).toBe("0px");
      const previous = boxes[index - 1];
      if (previous) expect(box.top).toBeGreaterThanOrEqual(previous.top + previous.height);
    }
    // The day really does overlap, so the check above is not vacuous.
    expect(items.some((item) => item.dataset.stacked === "true")).toBe(true);
  });

  it("[FAM-UI-01][PRD] grows the canvas to hold a crowded day instead of scrolling inside a small box", () => {
    renderTimeline(denseDay(32));
    const list = screen.getByRole("list", { name: "Care events today" });
    const canvas = list.parentElement!;

    expect(Number.parseFloat(canvas.style.height)).toBeGreaterThan(32 * 36);
    expect(canvas.className).not.toMatch(/overflow-(y-)?(auto|scroll)/);
  });

  it("[FAM-UI-01][PRD] lets a 120-character title and a 60-character name give way, not the status pill", () => {
    expect(LONG_TITLE).toHaveLength(120);
    expect(LONG_NAME).toHaveLength(60);
    const long = occurrence({
      title: LONG_TITLE,
      start: melbourne("10:00"),
      status: "done",
      actor: LONG_NAME,
      assignee: LONG_NAME,
    });
    renderTimeline([long]);
    const block = screen.getByRole("link", { name: new RegExp(LONG_TITLE.slice(0, 24)) });

    const title = within(block).getByText(LONG_TITLE);
    expect(title).toHaveClass("truncate");
    expect(title).toHaveAttribute("title", LONG_TITLE);

    const assignee = within(block).getByText(LONG_NAME);
    expect(assignee).toHaveClass("truncate");
    expect(assignee).toHaveAttribute("title", LONG_NAME);

    const pill = within(block).getByTitle(`Done · ${LONG_NAME}`);
    expect(pill).toHaveClass("shrink-0");
    expect(within(pill).getByText(`Done · ${LONG_NAME}`)).toBeInTheDocument();
  });

  it("[FAM-UI-01][PRD] shows non-ASCII titles and names intact", () => {
    const occ = occurrence({
      title: NON_ASCII_TITLE,
      start: melbourne("08:00"),
      status: "done",
      actor: NON_ASCII_NAME,
      assignee: NON_ASCII_NAME,
    });
    renderTimeline([occ]);
    const block = screen.getByRole("link", { name: /朝の薬/ });

    expect(within(block).getByText(NON_ASCII_TITLE)).toBeInTheDocument();
    expect(within(block).getByText(NON_ASCII_NAME)).toBeInTheDocument();
    expect(within(block).getByText(`Done · ${NON_ASCII_NAME}`)).toBeInTheDocument();
  });

  it("[FAM-UI-01][PRD] has no axe violations on a busy day", async () => {
    const { container } = renderTimeline(denseDay(32), new Date(melbourne("10:30")));

    expect(await axe(container)).toHaveNoViolations();
  });
});
