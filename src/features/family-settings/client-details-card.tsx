"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Field, fieldErrors, type FieldErrors } from "@/components/shared/forms";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { ageFromDob } from "@/lib/format/age";
import { saveClientDetails } from "@/server/clients/client-details-actions";
import {
  CLIENT_DETAIL_FIELDS,
  ClientDetailsInputSchema,
  type ClientDetailKey,
  type ClientDetails,
} from "@/server/clients/client-details-schema";

type Values = Record<ClientDetailKey, string>;

const SAVED = "Saved.";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toValues(details: ClientDetails): Values {
  return Object.fromEntries(
    CLIENT_DETAIL_FIELDS.map(({ key }) => [key, details[key] ?? ""]),
  ) as Values;
}

export interface ClientDetailsCardProps {
  clientId: string;
  firstName: string;
  details: ClientDetails;
}

/**
 * F0-28 '<First>'s details' on Family Settings: the client's date of birth, contact details,
 * address and emergency contact. Read-only until Edit, like Family info (CHG-024); Save goes
 * through `saveClientDetails`, Cancel goes back to what was last saved. Every field is optional.
 */
export function ClientDetailsCard({ clientId, firstName, details }: ClientDetailsCardProps) {
  const router = useRouter();
  const headingId = useId();
  const [saved, setSaved] = useState<Values>(() => toValues(details));
  const [values, setValues] = useState<Values>(saved);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  // One request at a time, so a double press saves once.
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const subject = `${firstName}'s details`;
  const failed = `Couldn't save ${subject}. Try again.`;

  function edit(key: ClientDetailKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setMessage((current) => (current === SAVED ? "" : current));
  }

  function focusField(key: string | undefined) {
    cardRef.current?.querySelector<HTMLElement>(`[name="${key}"]`)?.focus();
  }

  // Focus the first field once the inputs have lost readOnly.
  useEffect(() => {
    if (editing) focusField(CLIENT_DETAIL_FIELDS[0]?.key);
  }, [editing]);

  function startEditing() {
    setEditing(true);
    setMessage((current) => (current === SAVED ? "" : current));
  }

  function cancel() {
    setValues(saved);
    setErrors({});
    setEditing(false);
    // Cancel is about to go; the Edit/Save button stays mounted.
    cardRef.current?.querySelector<HTMLElement>("[data-client-details-action]")?.focus();
  }

  async function save() {
    if (saving) return;
    const checked = fieldErrors(ClientDetailsInputSchema, values);
    if (!checked.ok) {
      setErrors(checked.errors);
      setMessage("");
      focusField(CLIENT_DETAIL_FIELDS.find(({ key }) => checked.errors[key])?.key);
      return;
    }

    setSaving(true);
    setMessage("");
    let ok = false;
    try {
      ok = (await saveClientDetails(clientId, values)).ok;
    } catch {
      // A rejected action is a failed save, not a crash; the edits stay.
    }
    setSaving(false);

    if (!ok) {
      setMessage(failed);
      return;
    }
    // What was stored is what Cancel goes back to, trimmed as the database keeps it.
    const stored = Object.fromEntries(
      CLIENT_DETAIL_FIELDS.map(({ key }) => [key, values[key].trim()]),
    ) as Values;
    setValues(stored);
    setSaved(stored);
    setErrors({});
    setEditing(false);
    setMessage(SAVED);
    router.refresh();
  }

  const dob = values.dateOfBirth;
  const ageHint = ISO_DATE.test(dob) && !errors.dateOfBirth ? `Age ${ageFromDob(dob)}` : undefined;

  return (
    <section ref={cardRef} aria-labelledby={headingId}>
      <CardShell className="flex flex-col gap-4 p-5">
        <h3 id={headingId} className="text-title-card text-text-primary">
          {subject}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {CLIENT_DETAIL_FIELDS.map(({ key, label, type }) => (
            <Field
              key={key}
              name={key}
              label={label}
              type={type}
              value={values[key]}
              onChange={(value) => edit(key, value)}
              error={errors[key]}
              hint={key === "dateOfBirth" ? ageHint : undefined}
              readOnly={!editing}
            />
          ))}
        </div>
        <div className="flex justify-end gap-3">
          {editing && (
            <Button variant="secondary" onClick={cancel} aria-label={`Cancel editing ${subject}`}>
              Cancel
            </Button>
          )}
          <Button
            data-client-details-action
            disabled={saving}
            onClick={editing ? save : startEditing}
            // Starts with the visible word, so speech users can say what they see (WCAG 2.5.3).
            aria-label={`${editing ? "Save" : "Edit"} ${subject}`}
          >
            {editing ? "Save" : "Edit"}
          </Button>
        </div>
        <p role="status" className="text-body-default text-text-secondary empty:hidden">
          {message}
        </p>
      </CardShell>
    </section>
  );
}
