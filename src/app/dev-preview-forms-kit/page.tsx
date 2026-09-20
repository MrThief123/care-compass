"use client";

/**
 * Dev-only preview harness for the UI-02 forms kit. **Not a product screen.**
 *
 * It has no PRD entry, no acceptance criterion and no test of its own, and it
 * is not a template for the Family, Carer or Admin forms — those compose these
 * components against real data through `src/server/**`, and nothing here should
 * be copied into them. Every value it renders is synthetic; no client data ever
 * belongs in this file (CLAUDE.md §12).
 *
 * It exists for the same reason as `dev-preview-calendar-kit`: the kit's
 * remaining defects are visual and jsdom cannot see them — the modal overlay
 * and its focus ring, chip contrast in the selected and disabled states, the
 * two-column card grid collapsing, the 44px targets. It also carries the two
 * design-gap additions this feature had to invent, so a human can sanity-check
 * them per PD-053: the **Overdue chip is present but not selectable** (PD-044,
 * Overdue is derived) and the **Recurring select offers all nine frequencies**
 * (PD-046) where the frame shows only "Weekly".
 *
 * **Delete this route** once the Settings, Manage and event-form screens render
 * these components against `src/server/**` data — those screens become the
 * regression surface. FAM-UI-03 / FAM-UI-06 / ADM-UI-02 are the expected
 * trigger. See DECISIONS.md FD-04 in `docs/development/shared/shared-forms-kit/`.
 */

import { useState } from "react";

import { FileTile } from "@/components/shared/file-tile";
import { ChipGroup } from "@/components/shared/forms/chip-group";
import { ConfirmationModal } from "@/components/shared/forms/confirmation-modal";
import { DetailsFormCard } from "@/components/shared/forms/details-form-card";
import { EventForm, type EventFormValues } from "@/components/shared/forms/event-form";
import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { SettingsActionCard } from "@/components/shared/forms/settings-action-card";
import { SidePanelForm } from "@/components/shared/forms/side-panel-form";
import { TimeSlotChips, type TimeSlotValue } from "@/components/shared/forms/time-slot-chips";
import { DevPreviewNav } from "@/components/shared/dev-preview-nav";

const PHYSIOTHERAPY: EventFormValues = {
  date: "2026-11-30",
  recurrence: "weekly",
  status: "planned",
  description:
    "30-minute mobility and strength session with the physiotherapist. Focus on balance exercises per the current care plan.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-title-section text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export default function DevPreviewFormsKitPage() {
  const [event, setEvent] = useState(PHYSIOTHERAPY);
  const [slot, setSlot] = useState<TimeSlotValue>({
    slot: "custom",
    customStart: "12:00",
    customEnd: "10:00",
  });
  const [name, setName] = useState("Helen");
  const [email, setEmail] = useState("not-an-email");
  const [staffName, setStaffName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 bg-bg-canvas p-6">
      <DevPreviewNav />
      <h1 className="text-title-page text-text-primary">UI-02 forms kit — dev preview</h1>

      <Section title="Event form (Edit event)">
        <EventForm
          values={event}
          onChange={setEvent}
          onSubmit={() => {}}
          onCancel={() => {}}
          month="2026-11-15"
          datesWithItems={["2026-11-24", "2026-11-26", "2026-11-27"]}
          documents={
            <div className="flex flex-wrap gap-2">
              <FileTile variant="filled" fileName="Physio referral.pdf" />
              <FileTile variant="filled" fileName="Exercise plan.pdf" />
              <FileTile variant="add" onAdd={() => {}} />
            </div>
          }
        />
      </Section>

      <Section title="Settings cards">
        <SettingsActionCard
          title="Change organisation"
          description="Currently registered with Banksia Home Care."
          actionLabel="Change"
          onAction={() => {}}
        />
        <DetailsFormCard title="Family info" onSave={() => {}}>
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Phone" type="tel" value="0412 345 678" onChange={() => {}} />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            hint="Contact email only — this does not change your sign-in (OQ-35)."
            error={email.includes("@") ? undefined : "Enter a valid email address."}
          />
          <Field label="Address" value="12 Wattle St, Preston VIC 3072" onChange={() => {}} />
        </DetailsFormCard>
        <SettingsActionCard
          title="Reset username / password"
          description="We'll email you a secure link to reset your credentials."
          actionLabel="Reset"
          onAction={() => {}}
        />
      </Section>

      <Section title="Assign shift (chips, custom range, overlap warning)">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <TimeSlotChips value={slot} onChange={setSlot} />
            <InlineAlert>
              Aisha already has a shift with Margaret from 11:30–13:00 that overlaps this time. You
              can still assign it.
            </InlineAlert>
            <ChipGroup
              legend="Status (Overdue is derived — PD-044)"
              value="planned"
              onChange={() => {}}
              options={[
                { value: "planned", label: "Planned" },
                { value: "done", label: "Done" },
                { value: "overdue", label: "Overdue", disabled: true },
              ]}
            />
          </div>
          <SidePanelForm
            title="Add staff"
            submitLabel="Add staff"
            onSubmit={() => {}}
            onCancel={() => {}}
          >
            <Field label="Full name" value={staffName} onChange={setStaffName} required />
            <Field label="Email" type="email" value="" onChange={() => {}} />
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
          </SidePanelForm>
        </div>
      </Section>

      <Section title="Confirmation modal">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-11 w-fit rounded-control border border-border-brand px-4 text-body-default text-text-brand"
        >
          Deactivate staff member
        </button>
        <ConfirmationModal
          open={modalOpen}
          tone="destructive"
          title="Deactivate Aisha Rahman?"
          body="They will lose access immediately. Their past completions stay on record."
          confirmLabel="Deactivate"
          onConfirm={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      </Section>
    </main>
  );
}
