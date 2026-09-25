import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BudgetBucketSummary } from "@/types/domain";

import { BudgetStrip } from "./budget-strip";
import { CLIENT_ID, LONG_LABEL, UNBROKEN_LABEL, bucket } from "./test-support";

function renderStrip(buckets: BudgetBucketSummary[]) {
  const view = render(<BudgetStrip clientId={CLIENT_ID} buckets={buckets} />);
  return { ...view, budget: screen.getByRole("region", { name: "Budget" }) };
}

const DESIGN_BUCKETS = [
  bucket("NDIS", 24000, 9120),
  bucket("Fixed", 5000, 2250),
  bucket("Government", 3000, 2760),
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("[FAM-UI-01][AC-03] Budget strip totals", () => {
  it("[FAM-UI-01][AC-03] reads '$17,870 remaining of $32,000 · 44% used' for the design's three buckets", () => {
    const { budget } = renderStrip(DESIGN_BUCKETS);

    expect(within(budget).getByText("$17,870 remaining of $32,000 · 44% used")).toBeInTheDocument();
  });

  it("[FAM-UI-01][AC-03] keeps the cents of a large budget, $1,234,567.89, and its own remaining", () => {
    const { budget } = renderStrip([bucket("NDIS", 1234567.89, 34567.89)]);

    expect(
      within(budget).getByText("$1,200,000 remaining of $1,234,567.89 · 3% used"),
    ).toBeInTheDocument();
    const [tile] = within(budget).getAllByRole("listitem");
    expect(within(tile!).getByText("$1,200,000")).toBeInTheDocument();
    expect(within(tile!).getByText("of $1,234,567.89 · 3% used")).toBeInTheDocument();
  });

  it("[FAM-UI-01][AC-03] shows a remaining amount that has cents", () => {
    const { budget } = renderStrip([bucket("NDIS", 1234567.89, 1.1)]);

    expect(within(budget).getByText("$1,234,566.79")).toBeInTheDocument();
  });

  it("[FAM-UI-01][PRD] a zero-dollar budget reads $0 and 0% used, with no NaN or Infinity anywhere", () => {
    const { budget } = renderStrip([bucket("NDIS", 0, 0), bucket("Fixed", 0, 0)]);

    expect(within(budget).getByText("$0 remaining of $0 · 0% used")).toBeInTheDocument();
    expect(budget.textContent).not.toMatch(/NaN|Infinity|undefined|null/);
    for (const tile of within(budget).getAllByRole("listitem")) {
      expect(within(tile).getByText("of $0 · 0% used")).toBeInTheDocument();
    }
  });

  it("[FAM-UI-01][PRD] a bucket over 100% shows the real percentage, the overspend and an 'over budget' word", () => {
    const { budget } = renderStrip([bucket("Government", 3000, 3360)]);
    const [tile] = within(budget).getAllByRole("listitem");

    expect(within(tile!).getByText("-$360")).toBeInTheDocument();
    expect(within(tile!).getByText(/112% used/)).toBeInTheDocument();
    expect(within(tile!).getByText(/over budget/i)).toBeInTheDocument();
    expect(
      within(tile!).getByRole("progressbar", { name: "Government budget, 112% used" }),
    ).toHaveAttribute("aria-valuenow", "100");
    expect(within(budget).getByText("$360 over budget of $3,000 · 112% used")).toBeInTheDocument();
  });
});

describe("[FAM-UI-01][PRD] Budget strip bucket counts", () => {
  it("[FAM-UI-01][PRD] shows an empty state, and no figures, for a client with no buckets", () => {
    const { budget } = renderStrip([]);

    expect(within(budget).getByText("No funding set up yet")).toBeInTheDocument();
    expect(within(budget).queryByText(/remaining of/)).not.toBeInTheDocument();
    expect(within(budget).queryByRole("listitem")).not.toBeInTheDocument();
    expect(within(budget).getByRole("link", { name: "View breakdown" })).toHaveAttribute(
      "href",
      "/family/client-margaret/budget",
    );
  });

  it.each([1, 3, 8])("[FAM-UI-01][PRD] shows all %i bucket(s), each with its own card", (count) => {
    const buckets = Array.from({ length: count }, (_, index) =>
      bucket(`Bucket ${index + 1}`, 5000 + index * 1000, 1000 * index),
    );
    const { budget } = renderStrip(buckets);

    const tiles = within(budget).getAllByRole("listitem");
    expect(tiles).toHaveLength(count);
    for (const [index, tile] of tiles.entries()) {
      expect(within(tile).getByText(`Bucket ${index + 1}`)).toBeInTheDocument();
    }
  });

  it("[FAM-UI-01][PRD] eight buckets that share a kind still render with no duplicate-key warning", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const buckets = Array.from({ length: 8 }, (_, index) =>
      bucket(`Funding ${index + 1}`, 10000, 2000),
    );

    renderStrip(buckets);

    expect(errors).not.toHaveBeenCalled();
  });

  it("[FAM-UI-01][PRD] tiles are keyed by bucket id (CHG-021): when two buckets swap places, each tile keeps its element", () => {
    const [ndis, fixed, government] = DESIGN_BUCKETS;
    const { rerender, budget } = renderStrip([ndis!, fixed!, government!]);
    const [ndisTile, fixedTile] = within(budget).getAllByRole("listitem");

    rerender(<BudgetStrip clientId={CLIENT_ID} buckets={[fixed!, ndis!, government!]} />);

    const tiles = within(budget).getAllByRole("listitem");
    expect(tiles[0]).toBe(fixedTile);
    expect(tiles[1]).toBe(ndisTile);
  });

  it("[FAM-UI-01][PRD] a 60-character bucket name wraps or clamps, with the full name on hover, and never widens the card", () => {
    expect(LONG_LABEL).toHaveLength(60);
    const { budget } = renderStrip([
      bucket(LONG_LABEL, 5000, 1000),
      bucket(UNBROKEN_LABEL, 5000, 1000),
      bucket("Fixed", 5000, 1000),
    ]);
    const [spaced, unbroken] = within(budget).getAllByRole("listitem");

    for (const [tile, label] of [
      [spaced!, LONG_LABEL],
      [unbroken!, UNBROKEN_LABEL],
    ] as const) {
      const name = within(tile).getByText(label);
      expect(name).toHaveAttribute("title", label);
      expect(name).toHaveClass("line-clamp-2", "break-words");
      expect(tile).toHaveClass("min-w-0");
    }
  });

  it("[FAM-UI-01][PRD] shows a bucket's name as given, not upper-cased", () => {
    const { budget } = renderStrip(DESIGN_BUCKETS);

    const label = within(budget).getByText("Government");
    expect(label).toHaveClass("normal-case");
  });
});

describe("[FAM-UI-01][PRD] Budget strip status is never colour alone", () => {
  it("[FAM-UI-01][PRD] warning, alert and exhausted buckets each carry an icon and a status word; healthy ones carry neither", () => {
    const { budget } = renderStrip([
      bucket("Healthy", 10000, 1000),
      bucket("Warning", 10000, 7800),
      bucket("Alert", 10000, 9000),
      bucket("Exhausted", 10000, 10000),
    ]);
    const [healthy, warning, alert, exhausted] = within(budget).getAllByRole("listitem") as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];

    expect(within(healthy).queryByTestId("icon-alert-triangle")).not.toBeInTheDocument();
    expect(healthy).not.toHaveTextContent(/Budget (warning|alert|exhausted)/);

    for (const [tile, word] of [
      [warning, "Budget warning"],
      [alert, "Budget alert"],
      [exhausted, "Budget exhausted"],
    ] as const) {
      expect(within(tile).getByTestId("icon-alert-triangle")).toBeInTheDocument();
      expect(within(tile).getByText(word)).toBeInTheDocument();
    }
  });

  it("[FAM-UI-01][PRD] has no axe violations with eight buckets and an over-budget one", async () => {
    const buckets = [
      ...Array.from({ length: 7 }, (_, index) => bucket(`Funding ${index + 1}`, 10000, 2000)),
      bucket("Over", 3000, 3360),
    ];
    const { container } = renderStrip(buckets);

    expect(await axe(container)).toHaveNoViolations();
  });
});
