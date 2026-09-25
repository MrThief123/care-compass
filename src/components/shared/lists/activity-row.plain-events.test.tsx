import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActivityRow } from "./activity-row";

/**
 * Plain events in the lists kit (UI-05, CHG-009): a row for a plain event shows
 * a neutral "Event" label where a StatusPill would go — the word visible, no
 * status icon. Task rows are unchanged.
 */

describe("[UI-05][AC-09] ActivityRow for a plain event", () => {
  it("[UI-05][AC-09] shows the word Event where the status pill goes, with no status icon or word", () => {
    const { container } = render(
      <ActivityRow title="Garden walk" date="Thu 26 Nov" kind="event" />,
    );

    const label = screen.getByText("Event");
    expect(label).toBeVisible();
    expect(label).not.toHaveClass("sr-only");
    expect(container.querySelector("svg")).toBeNull();
    expect(container).not.toHaveTextContent(/Planned|Done|Overdue/);
    expect(container).toHaveTextContent("Garden walk");
    expect(container).toHaveTextContent("Thu 26 Nov");
  });

  it("[UI-05][AC-09] the Event label uses neutral tokens, not a status look", () => {
    render(<ActivityRow title="Garden walk" date="Thu 26 Nov" kind="event" />);
    const label = screen.getByText("Event");

    expect(label).toHaveClass("text-text-secondary", "border-border-default", "bg-bg-surface");
    expect(label).not.toHaveClass("text-text-brand", "text-text-alert-strong", "border-bg-muted");
  });

  it("[UI-05][AC-09] a clickable plain-event row is a button named with the title and Event, plus its chevron", () => {
    const onClick = vi.fn();
    render(<ActivityRow title="Garden walk" date="Thu 26 Nov" kind="event" onClick={onClick} />);

    const row = screen.getByRole("button");
    expect(row).toHaveAccessibleName(expect.stringContaining("Garden walk"));
    expect(row).toHaveAccessibleName(expect.stringContaining("Event"));
    // The chevron is the only icon: navigation, not status.
    expect(
      within(row)
        .getAllByTestId(/^icon-/)
        .map((icon) => icon.dataset.testid),
    ).toEqual(["icon-chevron-right"]);
    row.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("[UI-05][AC-09] ActivityRow for tasks is unchanged", () => {
  it("[UI-05][AC-09] Done shows the actor with a check icon", () => {
    render(
      <ActivityRow
        title="Morning medication"
        date="Sat 28 Nov"
        status="done"
        actorName="Aisha Rahman"
      />,
    );

    expect(screen.getByText("Done · Aisha Rahman")).toBeVisible();
    expect(screen.getByTestId("icon-check")).toBeInTheDocument();
    expect(screen.queryByText("Event")).toBeNull();
  });

  it("[UI-05][AC-09] Overdue shows the warning icon", () => {
    render(<ActivityRow title="Wound dressing check" date="Fri 27 Nov" status="overdue" />);

    expect(screen.getByText("Overdue")).toBeVisible();
    expect(screen.getByTestId("icon-alert-triangle")).toBeInTheDocument();
    expect(screen.queryByText("Event")).toBeNull();
  });

  it("[UI-05][AC-09] Planned shows the word with no icon, also with an explicit task kind", () => {
    const { container } = render(
      <ActivityRow title="Physiotherapy" date="Mon 30 Nov" status="planned" kind="task" />,
    );

    expect(screen.getByText("Planned")).toBeVisible();
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.queryByText("Event")).toBeNull();
  });
});
