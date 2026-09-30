"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Field } from "@/components/shared/forms/field";
import { SettingsActionCard } from "@/components/shared/forms/settings-action-card";
import { fieldErrors } from "@/components/shared/forms/validation";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { updateOrganisationSettings } from "@/server/admin/settings-actions";
import type { AdminSettingsData, OrganisationSettings } from "@/server/admin/settings-queries";
import { organisationSettingsSchema } from "@/server/admin/settings-schema";
import { requestOwnPasswordReset } from "@/server/profiles/actions";

const emptyValues: OrganisationSettings = { name: "", abn: "", phone: "", address: "" };
const FIELD_ORDER: (keyof OrganisationSettings)[] = ["name", "abn", "phone", "address"];
const SAVED = "Saved.";
const SAVE_FAILED = "Couldn't save the organisation details. Try again.";
const RESET_SENT = "We've emailed you a link to reset your password.";
const RESET_FAILED = "Couldn't send the reset link. Try again.";

export function SettingsScreen({ data }: { data: AdminSettingsData }) {
  const router = useRouter();
  const [values, setValues] = useState<OrganisationSettings>(() => ({
    ...(data.organisation ?? emptyValues),
  }));
  // What Cancel goes back to: the loaded values, then whatever was last saved.
  const [saved, setSaved] = useState<OrganisationSettings>(() => ({
    ...(data.organisation ?? emptyValues),
  }));
  // Read-only until 'Edit', so details can't be changed by accident (as Family info, CHG-024).
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof OrganisationSettings, string>>>({});
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const form = useRef<HTMLDivElement>(null);

  function change(key: keyof OrganisationSettings, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setNotice("");
  }
  function startEditing() {
    setEditing(true);
    setNotice("");
  }
  function cancel() {
    setValues(saved);
    setErrors({});
    setNotice("");
    setEditing(false);
    // Cancel is about to go; the Edit/Save button stays mounted.
    form.current?.querySelector<HTMLElement>("[data-org-action]")?.focus();
  }
  // Focus the first field once the inputs have lost readOnly.
  useEffect(() => {
    if (editing) form.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus();
  }, [editing]);
  function focusFirst(messages: Record<string, string>) {
    const first = FIELD_ORDER.find((key) => messages[key]);
    if (first) form.current?.querySelector<HTMLInputElement>('[name="' + first + '"]')?.focus();
  }
  async function save() {
    if (saving) return;
    const result = fieldErrors(organisationSettingsSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      setNotice("");
      focusFirst(result.errors);
      return;
    }
    setSaving(true);
    setNotice("");
    let outcome: Awaited<ReturnType<typeof updateOrganisationSettings>>;
    try {
      outcome = await updateOrganisationSettings(result.data);
    } catch {
      // A rejected action is a failed save, not a crash; the edits stay.
      outcome = { ok: false, error: { code: "UNEXPECTED", message: SAVE_FAILED } };
    }
    setSaving(false);
    if (!outcome.ok) {
      const messages = outcome.error.fieldErrors;
      if (messages && Object.keys(messages).length > 0) {
        setErrors(messages);
        focusFirst(messages);
      } else {
        setNotice(outcome.error.message);
      }
      return;
    }
    setValues(outcome.data);
    setSaved(outcome.data);
    setEditing(false);
    setErrors({});
    setNotice(SAVED);
    router.refresh();
  }
  async function reset() {
    if (resetting) return;
    setResetting(true);
    setNotice("");
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
    setNotice(sent ? RESET_SENT : failure);
  }

  return (
    <div className="p-6">
      <div className="flex max-w-[1040px] flex-col gap-5">
        {data.organisation ? (
          <div ref={form}>
            <CardShell className="flex flex-col gap-4 border-transparent p-5">
              <h3 className="text-title-card text-text-primary">Organisation Info</h3>
              <div data-testid="details-form-grid" className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Organisation Name"
                  name="name"
                  value={values.name}
                  onChange={(value) => change("name", value)}
                  error={errors.name}
                  readOnly={!editing}
                />
                <Field
                  label="ABN"
                  name="abn"
                  value={values.abn}
                  onChange={(value) => change("abn", value)}
                  error={errors.abn}
                  readOnly={!editing}
                />
                <Field
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={values.phone}
                  onChange={(value) => change("phone", value)}
                  error={errors.phone}
                  readOnly={!editing}
                />
                <Field
                  label="Address"
                  name="address"
                  value={values.address}
                  onChange={(value) => change("address", value)}
                  error={errors.address}
                  readOnly={!editing}
                />
              </div>
              <div className="flex justify-end gap-3">
                {editing && (
                  <Button variant="secondary" onClick={cancel}>
                    Cancel
                  </Button>
                )}
                <Button data-org-action disabled={saving} onClick={editing ? save : startEditing}>
                  {editing ? "Save" : "Edit"}
                </Button>
              </div>
            </CardShell>
          </div>
        ) : (
          <CardShell className="border-transparent p-5">
            <EmptyState
              title="No organisation details"
              body="Your organisation information is not available."
            />
          </CardShell>
        )}
        <SettingsActionCard
          title="Reset Username / Password"
          description="Send a password reset link to your sign-in email."
          actionLabel="Reset"
          onAction={reset}
          className="flex-wrap border-transparent"
        />
        <p role="status" className="text-body-default text-text-secondary">
          {notice}
        </p>
      </div>
    </div>
  );
}
