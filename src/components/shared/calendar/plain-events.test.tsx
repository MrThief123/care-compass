import { render, screen, within } from "@testing-library/react";
import { describe, expect, expectTypeOf, it } from "vitest";

import type { AnyOccurrence, Occurrence, PlainEventOccurrence } from "@/types/domain";

import { DayTimeline } from "./day-timeline";
import { EventPopover } from "./event-popover";
import { MonthGrid } from "./month-grid";
import { EVENT_CUE, STATUS_CUE, occurrenceCue } from "./status-cue";
import { WeekGrid } from "./week-grid";

/**
 * Plain events on the calendar kit (UI-05, CHG-009): a neutral bar, no status
 * shape, the word "Event" wherever a tier shows a status word, and "Event" in
 * the block's accessible name. Task blocks keep their three looks.
 */

function plainEvent(title: string, start: string, durationMinutes: number): PlainEventOccurrence {
  return {
    key: `event-${title.toLowerCase().replaceAll(" ", "-")}:${start}`,
    eventId: `event-${title.toLowerCase().replaceAll(" ", "-")}`,
    clientId: "client-margaret",
    title,
    description: "Around the block",
    start,
    durationMinutes,
    assignee: "Aisha Rahman",
    kind: "event",
  };
}

function task(
  title: string,
  start: string,
  durationMinutes: number,
  status: Occurrence["status"],
): Occurrence {
  return {
    key: `event-${title.toLowerCase().replaceAll(" ", "-")}:${start}`,
    eventId: `event-${title.toLowerCase().replaceAll(" ", "-")}`,
    clientId: "client-margaret",
    title,
    description: "",
    start,
    durationMinutes,
    status,
    ...(status === "done" ? { actor: "Aisha Rahman", completedAt: start } : {}),
    assignee: "Aisha Rahman",
  };
}

/** At the default 44px rows: 30 min is `compact`, 90 min `regular`, 120 min `full`. */
const SHORT_WALK = plainEvent("Short walk", "2026-11-30T07:00:00+11:00", 30);
const GARDEN = plainEvent("Garden time", "2026-11-30T09:00:00+11:00", 90);
const PARK = plainEvent("Park visit", "2026-11-30T12:00:00+11:00", 120);
const PLAIN_EVENTS = [SHORT_WALK, GARDEN, PARK];

const TASKS = [
  task("Morning medication", "2026-11-30T08:00:00+11:00", 30, "done"),
  task("Physiotherapy", "2026-11-30T10:30:00+11:00", 30, "planned"),
  task("Lunch check", "2026-11-30T15:00:00+11:00", 30, "overdue"),
];

const EVENT_BAR = EVENT_CUE.bar;

function bar(block: HTMLElement): Element {
  const first = block.firstElementChild;
  if (!first) throw new Error("block has no bar");
  return first;
}

function expectNeutral(block: HTMLElement) {
  expect(bar(block)).toHaveClass(EVENT_BAR);
  for (const cue of Object.values(STATUS_CUE)) expect(bar(block)).not.toHaveClass(cue.bar);
  // No check or alert shape, and no status word.
  expect(block.querySelector("svg")).toBeNull();
  expect(block).not.toHaveTextContent(/Planned|Done|Overdue/);
}

describe("[UI-05][AC-07] the event cue", () => {
  it("[UI-05][AC-07] EVENT_CUE is a neutral bar with the word Event and no shape", () => {
    expect(EVENT_CUE.label).toBe("Event");
    expect(EVENT_CUE.icon).toBeUndefined();
    for (const cue of Object.values(STATUS_CUE)) expect(EVENT_CUE.bar).not.toBe(cue.bar);
  });

  it("[UI-05][AC-07] occurrenceCue picks the event cue for a plain event and the status cue for a task", () => {
    expect(occurrenceCue(PARK)).toBe(EVENT_CUE);
    for (const row of TASKS) expect(occurrenceCue(row)).toBe(STATUS_CUE[row.status]);
  });

  it("[UI-05][AC-07] STATUS_CUE is unchanged for the three statuses", () => {
    expect(STATUS_CUE).toEqual({
      planned: { bar: "bg-bg-muted", label: "Planned" },
      done: { bar: "bg-bg-brand", icon: "check", label: "Done" },
      overdue: { bar: "bg-bg-alert-strong", icon: "alert-triangle", label: "Overdue" },
    });
  });
});

describe("[UI-05][AC-07] DayTimeline draws plain events", () => {
  it("[UI-05][AC-07] at every density a plain event has the neutral bar, no status shape, and Event in its name", () => {
    render(<DayTimeline occurrences={PLAIN_EVENTS} now={null} />);

    for (const row of PLAIN_EVENTS) {
      const block = screen.getByTestId(`day-timeline-block-${row.key}`);
      expectNeutral(block);
      expect(block).toHaveAccessibleName(expect.stringContaining("Event"));
      expect(block).toHaveAccessibleName(expect.stringContaining(row.title));
    }
  });

  it("[UI-05][AC-07] the full tier shows the word Event visibly where the status pill goes", () => {
    render(<DayTimeline occurrences={[PARK]} now={null} />);
    const block = screen.getByTestId(`day-timeline-block-${PARK.key}`);
    const word = within(block).getByText("Event");

    expect(word).not.toHaveClass("sr-only");
    expect(block).toHaveTextContent("Aisha Rahman");
  });

  it("[UI-05][AC-07] the compact and regular tiers say Event to screen readers", () => {
    render(<DayTimeline occurrences={[SHORT_WALK, GARDEN]} now={null} />);

    for (const row of [SHORT_WALK, GARDEN]) {
      const block = screen.getByTestId(`day-timeline-block-${row.key}`);
      expect(within(block).getByText("Event:", { exact: false })).toHaveClass("sr-only");
    }
  });

  it("[UI-05][AC-07] tasks drawn beside plain events keep their Planned, Done and Overdue looks", () => {
    render(<DayTimeline occurrences={[...TASKS, ...PLAIN_EVENTS]} now={null} />);

    for (const row of TASKS) {
      const block = screen.getByTestId(`day-timeline-block-${row.key}`);
      const cue = STATUS_CUE[row.status];
      expect(bar(block)).toHaveClass(cue.bar);
      expect(block).toHaveAccessibleName(expect.stringContaining(cue.label));
      expect(block.querySelector("svg") !== null).toBe(cue.icon !== undefined);
    }
  });

  it("[UI-05][AC-07] onSelect receives the plain event, typed as the occurrences passed in", async () => {
    const selected: AnyOccurrence[] = [];
    render(
      <DayTimeline
        occurrences={PLAIN_EVENTS as AnyOccurrence[]}
        now={null}
        onSelect={(occurrence) => {
          expectTypeOf(occurrence).toEqualTypeOf<AnyOccurrence>();
          selected.push(occurrence);
        }}
      />,
    );

    screen.getByTestId(`day-timeline-block-${PARK.key}`).click();
    expect(selected).toEqual([PARK]);
  });
});

describe("[UI-05][AC-07] WeekGrid draws plain events", () => {
  it("[UI-05][AC-07] at every density a plain event has the neutral bar, no status shape, and Event in its name", () => {
    render(<WeekGrid weekStart="2026-11-30" occurrences={PLAIN_EVENTS} now={null} />);

    const densities = PLAIN_EVENTS.map((row) => {
      const block = screen.getByTestId(`week-grid-block-${row.key}`);
      expectNeutral(block);
      expect(block).toHaveAccessibleName(expect.stringMatching(/^Event:/));
      expect(within(block).getByText("Event:", { exact: false })).toHaveClass("sr-only");
      return block.dataset.density;
    });
    expect(densities).toEqual(["compact", "regular", "full"]);
  });

  it("[UI-05][AC-07] tasks drawn beside plain events keep their Planned, Done and Overdue looks", () => {
    render(
      <WeekGrid weekStart="2026-11-30" occurrences={[...TASKS, ...PLAIN_EVENTS]} now={null} />,
    );

    for (const row of TASKS) {
      const block = screen.getByTestId(`week-grid-block-${row.key}`);
      const cue = STATUS_CUE[row.status];
      expect(bar(block)).toHaveClass(cue.bar);
      expect(block).toHaveAccessibleName(expect.stringMatching(new RegExp(`^${cue.label}:`)));
    }
  });

  it("[UI-05][AC-07] labelFormat and onSelectOccurrence take the occurrence type passed in", () => {
    render(
      <WeekGrid
        weekStart="2026-11-30"
        occurrences={PLAIN_EVENTS as AnyOccurrence[]}
        now={null}
        labelFormat={(occurrence) => {
          expectTypeOf(occurrence).toEqualTypeOf<AnyOccurrence>();
          return `Margaret — ${occurrence.title}`;
        }}
        onSelectOccurrence={(occurrence) => {
          expectTypeOf(occurrence).toEqualTypeOf<AnyOccurrence>();
        }}
      />,
    );

    expect(screen.getByTestId(`week-grid-block-${PARK.key}`)).toHaveTextContent(
      "Margaret — Park visit",
    );
  });
});

describe("[UI-05][AC-07] MonthGrid draws plain events", () => {
  it("[UI-05][AC-07] a plain-event chip has the neutral bar, no status shape and says Event to screen readers", () => {
    render(<MonthGrid month="2026-11-15" occurrences={PLAIN_EVENTS} maxChipsPerDay={6} />);

    for (const row of PLAIN_EVENTS) {
      const chip = screen.getByTestId(`month-grid-chip-${row.key}`);
      expectNeutral(chip);
      expect(within(chip).getByText("Event:", { exact: false })).toHaveClass("sr-only");
    }
    expect(screen.getByTestId("month-grid-day-2026-11-30")).toHaveAccessibleName(
      expect.stringMatching(/Event:\s?12:00\s?Park visit/),
    );
  });

  it("[UI-05][AC-07] task chips beside plain events keep their Planned, Done and Overdue looks", () => {
    render(
      <MonthGrid month="2026-11-15" occurrences={[...TASKS, ...PLAIN_EVENTS]} maxChipsPerDay={6} />,
    );

    for (const row of TASKS) {
      const chip = screen.getByTestId(`month-grid-chip-${row.key}`);
      const cue = STATUS_CUE[row.status];
      expect(bar(chip)).toHaveClass(cue.bar);
      expect(within(chip).getByText(`${cue.label}:`, { exact: false })).toHaveClass("sr-only");
      expect(chip.querySelector("svg") !== null).toBe(cue.icon !== undefined);
    }
  });

  it("[UI-05][AC-07] labelFormat takes the occurrence type passed in", () => {
    render(
      <MonthGrid
        month="2026-11-15"
        occurrences={PLAIN_EVENTS as AnyOccurrence[]}
        labelFormat={(occurrence) => {
          expectTypeOf(occurrence).toEqualTypeOf<AnyOccurrence>();
          return occurrence.title;
        }}
      />,
    );

    expect(screen.getByTestId(`month-grid-chip-${PARK.key}`)).toHaveTextContent("Park visit");
  });
});

describe("[UI-05][AC-08] EventPopover for a plain event", () => {
  function renderCard(occurrence: AnyOccurrence) {
    const anchor = document.createElement("button");
    document.body.append(anchor);
    render(<EventPopover occurrence={occurrence} anchor={anchor} onClose={() => {}} />);
    return screen.getByRole("tooltip");
  }

  it("[UI-05][AC-08] shows a neutral Event label with no status icon, no Done text and no completion time", () => {
    const card = renderCard(PARK);

    expect(within(card).getByText("Event")).toBeVisible();
    expect(card.querySelector("svg")).toBeNull();
    expect(card).not.toHaveTextContent(/Done ·|Planned|Overdue|Completed/);
    expect(card).toHaveTextContent("Park visit");
    expect(card).toHaveTextContent("12:00–14:00");
    expect(card).toHaveTextContent("Aisha Rahman");
    expect(card).toHaveTextContent("Around the block");
  });

  it("[UI-05][AC-08] a task's card still shows its status pill", () => {
    const card = renderCard(TASKS[0] as Occurrence);

    expect(card).toHaveTextContent("Done · Aisha Rahman");
    expect(within(card).queryByText("Event")).toBeNull();
  });
});
