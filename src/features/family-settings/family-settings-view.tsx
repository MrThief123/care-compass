"use client";

import { useEffect, useRef, useState } from "react";

import {
  ConfirmationModal,
  DetailsFormCard,
  Field,
  fieldErrors,
  SettingsActionCard,
  type FieldErrors,
} from "@/components/shared/forms";
import { CardShell } from "@/components/ui/card-shell";
import type { ClientHeaderSummary } from "@/server/clients/queries";
import type { FamilyContactDetails } from "@/server/profiles/queries";

import { familyInfoSchema, type FamilyInfoValues } from "./settings-schema";

export interface FamilySettingsViewProps {
  header: ClientHeaderSummary;
  contact: FamilyContactDetails;
}

const NOT_AVAILABLE = "Choosing a new organisation is not available yet.";
const RESET_SENT = "We've emailed you a link to reset your password.";
const SAVED = "Saved.";

/** Display order, which is also the order focus looks for the first bad field. */
const FIELDS: ReadonlyArray<{
  key: keyof FamilyInfoValues;
  label: string;
  type: "text" | "tel" | "email";
}> = [
  { key: "name", label: "Name", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "address", label: "Address", type: "text" },
];

/**
 * Family · Settings (FAM-UI-06): Change organisation, Family info and Reset
 * username / password. Phase 1: nothing is persisted or sent (FD-01 to FD-03).
 */
export function FamilySettingsView({ header, contact }: FamilySettingsViewProps) {
  const [values, setValues] = useState<FamilyInfoValues>({
    name: contact.name,
    phone: contact.phone ?? "",
    email: contact.email ?? "",
    address: contact.address ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Read-only until 'Edit', so details can't be changed by accident (CHG-024).
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function edit(key: keyof FamilyInfoValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setMessage((current) => (current === SAVED ? "" : current));
  }

  function startEditing() {
    setEditing(true);
    setMessage((current) => (current === SAVED ? "" : current));
  }

  // Focus Name once the inputs have lost readOnly.
  useEffect(() => {
    if (editing) formRef.current?.querySelector<HTMLElement>('[name="name"]')?.focus();
  }, [editing]);

  function save() {
    const result = fieldErrors(familyInfoSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      setMessage("");
      const first = FIELDS.find(({ key }) => result.errors[key]);
      formRef.current?.querySelector<HTMLElement>(`[name="${first?.key}"]`)?.focus();
      return;
    }
    setValues(result.data);
    setErrors({});
    setEditing(false);
    setMessage(SAVED);
  }

  const { organisationName, firstName } = header;

  return (
    <div className="flex flex-col gap-[22px] px-6 py-5">
      <h1 className="text-title-page text-text-primary">Settings</h1>
      {/* The kit cards title with h3; this keeps the heading order unbroken (FD-08). */}
      <h2 className="sr-only">Your account and organisation</h2>

      {organisationName ? (
        <SettingsActionCard
          title="Change organisation"
          description={`Currently registered with ${organisationName}.`}
          actionLabel="Change"
          onAction={() => {
            setMessage("");
            setConfirmOpen(true);
          }}
        />
      ) : (
        // The kit card requires an action; with no organisation 'Change' is absent (FD-05).
        <CardShell className="flex flex-col gap-1 p-5">
          <h3 className="text-title-card text-text-primary">Change organisation</h3>
          <p className="text-body-default text-text-secondary">
            Not registered with an organisation.
          </p>
        </CardShell>
      )}

      <div ref={formRef}>
        <DetailsFormCard
          title="Family info"
          onSave={editing ? save : startEditing}
          saveLabel={editing ? "Save" : "Edit"}
        >
          {FIELDS.map(({ key, label, type }) => (
            <Field
              key={key}
              name={key}
              label={label}
              type={type}
              value={values[key]}
              onChange={(value) => edit(key, value)}
              error={errors[key]}
              required={key === "name"}
              readOnly={!editing}
            />
          ))}
        </DetailsFormCard>
      </div>

      <SettingsActionCard
        title="Reset username / password"
        description="We'll email you a secure link to reset your credentials."
        actionLabel="Reset"
        onAction={() => setMessage(RESET_SENT)}
      />

      {/* On the page from the start so screen readers pick up what is announced (FD-01). */}
      <p role="status" className="text-body-default text-text-secondary empty:hidden">
        {message}
      </p>

      <ConfirmationModal
        open={confirmOpen}
        tone="destructive"
        title="Change organisation?"
        body={`Switching ${firstName}'s care to a new organisation keeps her routines, events, budget, documents and history. Assigned nurses and all future shifts will be cleared, and ${organisationName} will lose access immediately. This can't be undone from your side.`}
        confirmLabel="Change organisation"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setMessage(NOT_AVAILABLE);
        }}
      />
    </div>
  );
}
