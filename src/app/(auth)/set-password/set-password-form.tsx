"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { setPassword } from "@/server/auth/actions";

/**
 * F0-24: an invited carer sets their first password from the invite session `/auth/confirm`
 * established. Same layout, field and states as `/reset-password` (OQ-19: no auth-page designs);
 * only the wording differs, and saving signs them in to their role home.
 */
export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPasswordValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setPassword({ password });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push(result.data.redirectTo);
    });
  };

  return (
    <CardShell className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-page text-text-primary">Set your password</h1>
        <p className="text-body-small text-text-secondary">
          Welcome to Care Compass. Choose a password to finish setting up your account.
        </p>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}

      <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="New password"
          type="password"
          name="password"
          value={password}
          onChange={setPasswordValue}
          hint="At least 8 characters."
          required
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </CardShell>
  );
}
