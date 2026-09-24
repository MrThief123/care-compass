"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { resetPassword } from "@/server/auth/actions";

/** Set a new password from the recovery session `/auth/confirm` established. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await resetPassword({ password });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push("/sign-in");
    });
  };

  return (
    <CardShell className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-page text-text-primary">Set a new password</h1>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="New password"
          type="password"
          name="password"
          value={password}
          onChange={setPassword}
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
