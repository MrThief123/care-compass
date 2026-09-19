import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { ChipGroup } from "./chip-group";
import { ConfirmationModal } from "./confirmation-modal";
import { DetailsFormCard } from "./details-form-card";
import { EventForm } from "./event-form";
import { Field } from "./field";
import { InlineAlert } from "./inline-alert";
import { SettingsActionCard } from "./settings-action-card";
import { SidePanelForm } from "./side-panel-form";
import { TimeSlotChips } from "./time-slot-chips";

describe("[UI-02][AC-06] forms kit accessibility", () => {
  it("Field has no axe violations across every type", async () => {
    const { container } = render(
      <div>
        <Field label="Name" value="Helen" onChange={() => {}} />
        <Field label="Email" type="email" value="helen@example.com" onChange={() => {}} />
        <Field label="Phone" type="tel" value="0412 345 678" onChange={() => {}} />
        <Field label="Start date" type="date" value="2026-11-30" onChange={() => {}} />
        <Field label="Notes" type="textarea" value="Enjoys gardening." onChange={() => {}} />
        <Field
          label="Role"
          type="select"
          value="carer"
          onChange={() => {}}
          options={[
            { value: "carer", label: "Carer" },
            { value: "admin", label: "Admin" },
          ]}
        />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Field with a hint and an error has no axe violations", async () => {
    const { container } = render(
      <Field
        label="Email"
        type="email"
        value="not-an-email"
        onChange={() => {}}
        hint="We use this to send budget warnings."
        error="Enter a valid email address."
        required
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SettingsActionCard has no axe violations", async () => {
    const { container } = render(
      <SettingsActionCard
        title="Change organisation"
        description="Currently registered with Banksia Home Care."
        actionLabel="Change"
        onAction={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("DetailsFormCard has no axe violations", async () => {
    const { container } = render(
      <DetailsFormCard title="Family info" onSave={() => {}}>
        <Field label="Name" value="Helen" onChange={() => {}} />
        <Field label="Phone" type="tel" value="0412 345 678" onChange={() => {}} />
      </DetailsFormCard>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SidePanelForm has no axe violations", async () => {
    const { container } = render(
      <SidePanelForm title="Add staff" submitLabel="Add staff" onSubmit={() => {}}>
        <Field label="Full name" value="" onChange={() => {}} />
      </SidePanelForm>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ChipGroup has no axe violations", async () => {
    const { container } = render(
      <ChipGroup
        legend="Status"
        value="planned"
        onChange={() => {}}
        options={[
          { value: "planned", label: "Planned" },
          { value: "done", label: "Done" },
          { value: "overdue", label: "Overdue", disabled: true },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("TimeSlotChips has no axe violations with the custom range open and invalid", async () => {
    const { container } = render(
      <TimeSlotChips
        value={{ slot: "custom", customStart: "12:00", customEnd: "10:00" }}
        onChange={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("InlineAlert has no axe violations", async () => {
    const { container } = render(
      <InlineAlert>
        Aisha already has a shift with Margaret from 11:30–13:00 that overlaps this time. You can
        still assign it.
      </InlineAlert>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ConfirmationModal has no axe violations", async () => {
    const { container } = render(
      <ConfirmationModal
        open
        tone="destructive"
        title="Deactivate Aisha Rahman?"
        body="They will lose access immediately."
        confirmLabel="Deactivate"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("EventForm has no axe violations", async () => {
    const { container } = render(
      <EventForm
        values={{
          date: "2026-11-30",
          recurrence: "weekly",
          status: "planned",
          description: "30-minute mobility and strength session with the physiotherapist.",
        }}
        onChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        month="2026-11-15"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
