"use client";

import { useEffect, useRef, useState } from "react";

import {
  ConfirmationModal,
  Field,
  fieldErrors,
  SettingsActionCard,
  type FieldErrors,
} from "@/components/shared/forms";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import type { ClientHeaderSummary } from "@/server/clients/queries";
import { requestOwnPasswordReset, updateFamilyContactDetails } from "@/server/profiles/actions";
import type { FamilyContactDetails } from "@/server/profiles/queries";

import { familyInfoSchema, type FamilyInfoValues } from "./settings-schema";

export interface FamilySettingsViewProps {
  header: ClientHeaderSummary;
  contact: FamilyContactDetails;
}

const NOT_AVAILABLE = "Choosing a new organisation is not available yet.";
const RESET_SENT = "We've emailed you a link to reset your password.";
const SAVED = "Saved.";
// Shown when the action itself could not be reached; the server's own messages match these.
const SAVE_FAILED = "Couldn't save your details. Try again.";
const RESET_FAILED = "Couldn't send the reset link. Try again.";

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
 * username / password. Save and Reset go through the `profiles` Server Actions
 * (FAM-12); Change organisation is still FAM-13's (FD-01).
 */
export function FamilySettingsView({ header, contact }: FamilySettingsViewProps) {
  // What Cancel goes back to: the fixture, then whatever was last saved (CHG-024).
  const [saved, setSaved] = useState<FamilyInfoValues>({
    name: contact.name,
    phone: contact.phone ?? "",
    email: contact.email ?? "",
    address: contact.address ?? "",
  });
  const [values, setValues] = useState<FamilyInfoValues>(saved);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  // One request at a time, so a double press saves or emails once.
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
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

  function cancel() {
    setValues(saved);
    setErrors({});
    setEditing(false);
    // Cancel is about to go; the Edit/Save button stays mounted.
    formRef.current?.querySelector<HTMLElement>("[data-family-info-action]")?.focus();
  }

  // Focus Name once the inputs have lost readOnly.
  useEffect(() => {
    if (editing) formRef.current?.querySelector<HTMLElement>('[name="name"]')?.focus();
  }, [editing]);

  function focusField(key: string | undefined) {
    formRef.current?.querySelector<HTMLElement>(`[name="${key}"]`)?.focus();
  }

  async function save() {
    if (saving) return;
    const result = fieldErrors(familyInfoSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      setMessage("");
      focusField(FIELDS.find(({ key }) => result.errors[key])?.key);
      return;
    }

    setSaving(true);
    setMessage("");
    let outcome: Awaited<ReturnType<typeof updateFamilyContactDetails>>;
    try {
      outcome = await updateFamilyContactDetails(result.data);
    } catch {
      // A rejected action is a failed save, not a crash; the edits stay.
      outcome = { ok: false, error: { code: "UNEXPECTED", message: SAVE_FAILED } };
    }
    setSaving(false);

    if (!outcome.ok) {
      const messages = outcome.error.fieldErrors;
      if (messages && Object.keys(messages).length > 0) {
        setErrors(messages);
        focusField(FIELDS.find(({ key }) => messages[key])?.key);
      } else {
        setMessage(outcome.error.message);
      }
      return;
    }

    // What was stored is what Cancel goes back to, and what the inputs show.
    const stored: FamilyInfoValues = {
      name: outcome.data.name,
      phone: outcome.data.phone ?? "",
      email: outcome.data.email ?? "",
      address: outcome.data.address ?? "",
    };
    setValues(stored);
    setSaved(stored);
    setErrors({});
    setEditing(false);
    setMessage(SAVED);
  }

  async function reset() {
    if (resetting) return;
    setResetting(true);
    setMessage("");
    let sent = false;
    let failure = RESET_FAILED;
    try {
      const outcome = await requestOwnPasswordReset();
      sent = outcome.ok;
      if (!outcome.ok) failure = outcome.error.message;
    } catch {
      // Not sent: never say it was.
    }
    setResetting(false);
    setMessage(sent ? RESET_SENT : failure);
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

      {/* The kit's DetailsFormCard, rebuilt here because it has no Cancel slot (FD-10). */}
      <div ref={formRef}>
        <CardShell className="flex flex-col gap-4 p-5">
          <h3 className="text-title-card text-text-primary">Family info</h3>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <div className="flex justify-end gap-3">
            {editing && (
              <Button variant="secondary" onClick={cancel}>
                Cancel
              </Button>
            )}
            <Button
              data-family-info-action
              disabled={saving}
              onClick={editing ? save : startEditing}
            >
              {editing ? "Save" : "Edit"}
            </Button>
          </div>
        </CardShell>
      </div>

      <SettingsActionCard
        title="Reset username / password"
        description="We'll email you a secure link to reset your credentials."
        actionLabel="Reset"
        onAction={reset}
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
