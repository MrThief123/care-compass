"use client";

import { useRef, useState } from "react";
import { z } from "zod";

import { DetailsFormCard } from "@/components/shared/forms/details-form-card";
import { Field } from "@/components/shared/forms/field";
import { SettingsActionCard } from "@/components/shared/forms/settings-action-card";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { AdminSettingsData, OrganisationSettings } from "@/server/admin/settings-queries";

const organisationSchema = z.object({
  name: z.string().trim().min(1, "Enter an organisation name."),
  abn: z
    .string()
    .trim()
    .refine(
      (value) => /^[0-9 ]+$/.test(value) && value.replace(/ /g, "").length === 11,
      "Enter an ABN with 11 digits.",
    ),
  phone: z.string().trim().min(1, "Enter a phone number."),
  address: z.string().trim().min(1, "Enter an address."),
});
const emptyValues: OrganisationSettings = { name: "", abn: "", phone: "", address: "" };

export function SettingsScreen({ data }: { data: AdminSettingsData }) {
  const [values, setValues] = useState<OrganisationSettings>(() => ({
    ...(data.organisation ?? emptyValues),
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof OrganisationSettings, string>>>({});
  const [notice, setNotice] = useState("");
  const form = useRef<HTMLDivElement>(null);

  function change(key: keyof OrganisationSettings, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setNotice("");
  }
  function save() {
    const result = organisationSchema.safeParse(values);
    if (!result.success) {
      const next: Partial<Record<keyof OrganisationSettings, string>> = {};
      for (const issue of result.error.issues)
        next[issue.path[0] as keyof OrganisationSettings] = issue.message;
      setErrors(next);
      setNotice("");
      const firstField = result.error.issues[0]?.path[0];
      if (typeof firstField === "string")
        form.current?.querySelector<HTMLInputElement>('[name="' + firstField + '"]')?.focus();
      return;
    }
    setValues(result.data);
    setErrors({});
    setNotice("Organisation details saved. Changes reset when you reload.");
  }

  return (
    <div className="p-6">
      <div className="flex max-w-[1040px] flex-col gap-5">
        {data.organisation ? (
          <div ref={form}>
            <DetailsFormCard title="Organisation Info" onSave={save} className="border-transparent">
              <Field
                label="Organisation Name"
                name="name"
                value={values.name}
                onChange={(value) => change("name", value)}
                error={errors.name}
              />
              <Field
                label="ABN"
                name="abn"
                value={values.abn}
                onChange={(value) => change("abn", value)}
                error={errors.abn}
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={(value) => change("phone", value)}
                error={errors.phone}
              />
              <Field
                label="Address"
                name="address"
                value={values.address}
                onChange={(value) => change("address", value)}
                error={errors.address}
              />
            </DetailsFormCard>
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
          onAction={() => setNotice("Password reset requested in this preview. No email was sent.")}
          className="flex-wrap border-transparent"
        />
        <p className="text-body-small text-text-secondary">
          Changes on this preview reset when you reload.
        </p>
        <p role="status" className="text-body-default text-text-secondary">
          {notice}
        </p>
      </div>
    </div>
  );
}
