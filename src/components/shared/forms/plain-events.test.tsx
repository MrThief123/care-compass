import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { EventForm, type EventFormValues, type PlainEventFormValues } from "./event-form";
import { Switch } from "./switch";

/**
 * Forms kit for plain events (UI-05, CHG-009): a shared switch that can stand
 * in for FAM-UI-03's local `TaskSwitch`, and an EventForm option that drops
 * the Status chips for a plain event.
 */

const TASK_LABEL = "This is a task — must be ticked off";

function ControlledSwitch({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  return <Switch label={TASK_LABEL} checked={checked} onChange={setChecked} />;
}

describe("[UI-05][AC-10] the shared switch", () => {
  it("[UI-05][AC-10] is a switch named by its visible label, with aria-checked and the word On", () => {
    render(<Switch label={TASK_LABEL} checked onChange={() => {}} />);
    const control = screen.getByRole("switch", { name: TASK_LABEL });

    expect(control).toHaveAttribute("aria-checked", "true");
    expect(control).toHaveTextContent("On");
    expect(control).not.toHaveTextContent("Off");
    expect(screen.getByText(TASK_LABEL)).toBeVisible();
  });

  it("[UI-05][AC-10] says Off when unchecked", () => {
    render(<Switch label={TASK_LABEL} checked={false} onChange={() => {}} />);
    const control = screen.getByRole("switch", { name: TASK_LABEL });

    expect(control).toHaveAttribute("aria-checked", "false");
    expect(control).toHaveTextContent("Off");
  });

  it("[UI-05][AC-10] has a target at least 44px tall", () => {
    render(<Switch label={TASK_LABEL} checked onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveClass("min-h-11");
  });

  it("[UI-05][AC-10] a click calls onChange with the opposite value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label={TASK_LABEL} checked={false} onChange={onChange} />);

    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("[UI-05][AC-10] Space and Enter toggle it while focused", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label={TASK_LABEL} checked onChange={onChange} />);

    screen.getByRole("switch").focus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(onChange.mock.calls).toEqual([[false], [false]]);
  });

  it("[UI-05][AC-10] respects the controlled value", async () => {
    const user = userEvent.setup();
    render(<ControlledSwitch initial />);
    const control = screen.getByRole("switch");

    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(control).toHaveTextContent("Off");
    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("[UI-05][AC-10] takes the same checked / onChange props as FAM-UI-03's TaskSwitch", () => {
    type TaskSwitchProps = { checked: boolean; onChange: (checked: boolean) => void };
    expectTypeOf<Pick<Parameters<typeof Switch>[0], "checked" | "onChange">>().toEqualTypeOf<
      TaskSwitchProps
    >();
  });
});

const WALK: EventFormValues = {
  date: "2026-11-26",
  recurrence: "daily",
  status: "planned",
  description: "Around the block with Aisha.",
};

describe("[UI-05][AC-11] EventForm hides Status for a plain event", () => {
  it("[UI-05][AC-11] with hideStatus the Status chips are absent, not disabled", () => {
    render(
      <EventForm
        values={WALK}
        onChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        month="2026-11-15"
        hideStatus
      />,
    );

    expect(screen.queryByRole("radiogroup", { name: "Status" })).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByText("Status")).toBeNull();
    expect(screen.getByLabelText("Recurring")).toHaveValue("daily");
    expect(screen.getByLabelText("Description")).toHaveValue(WALK.description);
  });

  it("[UI-05][AC-11] with hideStatus the form submits without a status", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: PlainEventFormValues) => void>();
    render(
      <EventForm
        values={WALK}
        onChange={() => {}}
        onSubmit={onSubmit}
        onCancel={() => {}}
        month="2026-11-15"
        hideStatus
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      date: "2026-11-26",
      recurrence: "daily",
      description: "Around the block with Aisha.",
    });
    expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty("status");
  });

  it("[UI-05][AC-11] with hideStatus a missing Date still blocks the submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EventForm
        values={{ ...WALK, date: "" }}
        onChange={() => {}}
        onSubmit={onSubmit}
        onCancel={() => {}}
        month="2026-11-15"
        hideStatus
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(screen.getByLabelText("Date")).toHaveAccessibleDescription("Date is required.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("[UI-05][AC-11] without hideStatus the Status chips render and submit the status as before", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EventForm
        values={WALK}
        onChange={() => {}}
        onSubmit={onSubmit}
        onCancel={() => {}}
        month="2026-11-15"
      />,
    );

    expect(screen.getByRole("radiogroup", { name: "Status" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(WALK);
  });

  it("[UI-05][AC-11] the switch drives hideStatus, as the Add / Edit event screen will", async () => {
    const user = userEvent.setup();
    function Screen() {
      const [isTask, setIsTask] = useState(true);
      return (
        <EventForm
          values={WALK}
          onChange={() => {}}
          onSubmit={(values: PlainEventFormValues) => void values}
          onCancel={() => {}}
          month="2026-11-15"
          hideStatus={!isTask}
          extraFields={<Switch label={TASK_LABEL} checked={isTask} onChange={setIsTask} />}
        />
      );
    }
    render(<Screen />);

    expect(screen.getByRole("radiogroup", { name: "Status" })).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: TASK_LABEL }));
    expect(screen.queryByRole("radiogroup", { name: "Status" })).toBeNull();
    await user.click(screen.getByRole("switch", { name: TASK_LABEL }));
    expect(screen.getByRole("radiogroup", { name: "Status" })).toBeInTheDocument();
  });

  it("[UI-05][AC-11] PlainEventFormValues is EventFormValues without status", () => {
    expectTypeOf<PlainEventFormValues>().toEqualTypeOf<Omit<EventFormValues, "status">>();
  });
});
