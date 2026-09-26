"use client";

import { useState } from "react";

import { Field, SettingsActionCard } from "@/components/shared/forms";
import { CardShell } from "@/components/ui/card-shell";
import type { CarerContactDetails } from "@/server/profiles/queries";

const RESET_SENT = "We've emailed you a link to reset your password.";

/**
 * Carer · Settings (CAR-UI-04): My info, read-only with no Edit or Save, and
 * Reset username / password, which only announces the link locally (FD-03).
 * CAR-09 wires Save and Reset.
 */
export function CarerSettingsView({ contact }: { contact: CarerContactDetails }) {
  const [message, setMessage] = useState("");
  const fields = [
    { label: "Name", value: contact.name },
    { label: "Phone", value: contact.phone },
    { label: "Email", value: contact.email },
    { label: "Role", value: contact.role },
  ];

  return (
    <div className="flex flex-col gap-[22px] px-6 py-5">
      <h1 className="text-title-page text-text-primary">Settings</h1>
      {/* The kit cards title with h3; this keeps the heading order unbroken. */}
      <h2 className="sr-only">Your account</h2>

      <CardShell className="flex flex-col gap-4 p-5">
        <h3 className="text-title-card text-text-primary">My info</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, value }) => (
            <Field
              key={label}
              label={label}
              value={value ?? ""}
              onChange={() => {}}
              readOnly
              className="min-w-0"
            />
          ))}
        </div>
      </CardShell>

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
