import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChipGroup } from "./chip-group";
import { DetailsFormCard } from "./details-form-card";
import { Field } from "./field";
import { InlineAlert } from "./inline-alert";
import { SettingsActionCard } from "./settings-action-card";
import { SidePanelForm } from "./side-panel-form";

describe("[UI-02][AC-06] SettingsActionCard", () => {
  it("shows the title, description and an outline action button", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <SettingsActionCard
        title="Reset username / password"
        description="We'll email you a secure link to reset your credentials."
        actionLabel="Reset"
        onAction={onAction}
      />,
    );

    expect(screen.getByText("Reset username / password")).toBeInTheDocument();
    expect(
      screen.getByText("We'll email you a secure link to reset your credentials."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});

describe("[UI-02][AC-06] DetailsFormCard", () => {
  it("renders a titled two-column field grid with a Save button (OQ-35)", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <DetailsFormCard title="Family info" onSave={onSave}>
        <Field label="Name" value="Helen" onChange={() => {}} />
        <Field label="Phone" type="tel" value="0412 345 678" onChange={() => {}} />
      </DetailsFormCard>,
    );

    expect(screen.getByRole("heading", { name: "Family info" })).toBeInTheDocument();
    expect(screen.getByTestId("details-form-grid")).toHaveClass("sm:grid-cols-2");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("omits the save affordance when no handler is given", () => {
    render(
      <DetailsFormCard title="Organisation info">
        <Field label="Name" value="Banksia Home Care" onChange={() => {}} />
      </DetailsFormCard>,
    );

    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });
});

describe("[UI-02][AC-06] SidePanelForm", () => {
  it("submits through the full-width primary button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <SidePanelForm title="Add client" submitLabel="Add client" onSubmit={onSubmit}>
        <Field label="Full name" value="Margaret" onChange={() => {}} />
      </SidePanelForm>,
    );

    expect(screen.getByRole("heading", { name: "Add client" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add client" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("submits on Enter from a field, without reloading the page", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <SidePanelForm title="Add staff" submitLabel="Add staff" onSubmit={onSubmit}>
        <Field label="Full name" value="Aisha" onChange={() => {}} />
      </SidePanelForm>,
    );

    await user.type(screen.getByLabelText("Full name"), "{Enter}");
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe("[UI-02][AC-03] ChipGroup", () => {
  const options = [
    { value: "planned", label: "Planned" },
    { value: "done", label: "Done" },
    { value: "overdue", label: "Overdue", disabled: true },
  ];

  it("exposes a single-select radiogroup", () => {
    render(<ChipGroup legend="Status" value="planned" onChange={() => {}} options={options} />);

    expect(screen.getByRole("radiogroup", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Planned" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Done" })).toHaveAttribute("aria-checked", "false");
  });

  it("reports the chosen value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ChipGroup legend="Status" value="planned" onChange={onChange} options={options} />);
    await user.click(screen.getByRole("radio", { name: "Done" }));

    expect(onChange).toHaveBeenCalledWith("done");
  });

  it("never reports a disabled option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ChipGroup legend="Status" value="planned" onChange={onChange} options={options} />);
    await user.click(screen.getByRole("radio", { name: "Overdue" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps 44px targets (REQ-N2)", () => {
    render(<ChipGroup legend="Status" value="planned" onChange={() => {}} options={options} />);

    expect(screen.getByRole("radio", { name: "Planned" })).toHaveClass("h-11");
  });
});

describe("[UI-02][AC-06] InlineAlert", () => {
  it("announces its message with a warning icon, not colour alone (REQ-N2)", () => {
    render(<InlineAlert>Aisha already has a shift that overlaps this time.</InlineAlert>);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Aisha already has a shift that overlaps this time.");
    expect(screen.getByTestId("icon-alert-triangle")).toBeInTheDocument();
  });
});
