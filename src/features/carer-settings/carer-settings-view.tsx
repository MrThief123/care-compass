"use client";

import { useEffect, useRef, useState } from "react";

import { Field, fieldErrors, SettingsActionCard, type FieldErrors } from "@/components/shared/forms";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { familyInfoSchema } from "@/server/profiles/contact-schema";
import type { CarerContactDetails } from "@/server/profiles/queries";

const RESET_SENT = "We've emailed you a link to reset your password.";
const SAVED = "Saved.";

/** Same rules as Family info, less Address; Role is not editable (PD-054). */
const myInfoSchema = familyInfoSchema.omit({ address: true });
type MyInfoValues = { name: string; phone: string; email: string };

/** Display order, which is also the order focus looks for the first bad field. */
const FIELDS: ReadonlyArray<{ key: keyof MyInfoValues; label: string; type: "text" | "tel" | "email" }> = [
  { key: "name", label: "Name", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
];

/**
 * Carer · Settings (CAR-UI-04): My info, read-only until 'Edit' like Family
 * Settings, and Reset username / password. Save and Reset only update this
 * screen in Phase 1 (FD-03, FD-06); CAR-09 wires them to the server.
 */
export function CarerSettingsView({ contact }: { contact: CarerContactDetails }) {
  // What Cancel goes back to: the fixture, then whatever was last saved.
  const [saved, setSaved] = useState<MyInfoValues>({
    name: contact.name,
    phone: contact.phone ?? "",
    email: contact.email ?? "",
  });
  const [values, setValues] = useState<MyInfoValues>(saved);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  function focusField(key: string | undefined) {
    formRef.current?.querySelector<HTMLElement>(`[name="${key}"]`)?.focus();
  }

  // Focus Name once the inputs have lost readOnly.
  useEffect(() => {
    if (editing) focusField("name");
  }, [editing]);

  function edit(key: keyof MyInfoValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function startEditing() {
    setEditing(true);
    setMessage("");
  }

  function stopEditing(next: MyInfoValues) {
    setValues(next);
    setErrors({});
    setEditing(false);
    // Cancel is about to go; the Edit/Save button stays mounted.
    formRef.current?.querySelector<HTMLElement>("[data-my-info-action]")?.focus();
  }

  function save() {
    const result = fieldErrors(myInfoSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      focusField(FIELDS.find(({ key }) => result.errors[key])?.key);
      return;
    }
    setSaved(result.data);
    stopEditing(result.data);
    setMessage(SAVED);
  }

  return (
    <div className="flex flex-col gap-[22px] px-6 py-5">
      <h1 className="text-title-page text-text-primary">Settings</h1>
      {/* The kit cards title with h3; this keeps the heading order unbroken. */}
      <h2 className="sr-only">Your account</h2>

      <div ref={formRef}>
        <CardShell className="flex flex-col gap-4 p-5">
          <h3 className="text-title-card text-text-primary">My info</h3>
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
                className="min-w-0"
              />
            ))}
            <Field
              label="Role"
              value={contact.role ?? ""}
              onChange={() => {}}
              readOnly
              className="min-w-0"
            />
          </div>
          <div className="flex justify-end gap-3">
            {editing && (
              <Button variant="secondary" onClick={() => stopEditing(saved)}>
                Cancel
              </Button>
            )}
            <Button data-my-info-action onClick={editing ? save : startEditing}>
              {editing ? "Save" : "Edit"}
            </Button>
          </div>
        </CardShell>
      </div>

      <SettingsActionCard
        title="Reset username / password"
        description="We'll email you a secure link to reset your credentials."
        actionLabel="Reset"
        onAction={() => setMessage(RESET_SENT)}
      />

      {/* On the page from the start so screen readers pick up what is announced. */}
      <p role="status" className="text-body-default text-text-secondary empty:hidden">
        {message}
      </p>
    </div>
  );
}
