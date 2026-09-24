"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { verifyMfaCode } from "@/server/auth/actions";

export interface MfaVerifyFormProps {
  factorId: string;
}

/** AC-10: the sign-in-time TOTP challenge for an admin with an already-verified factor. */
export function MfaVerifyForm({ factorId }: MfaVerifyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyMfaCode({ factorId, code });
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
        <h1 className="text-title-page text-text-primary">Enter your authentication code</h1>
        <p className="text-body-default text-text-secondary">
          Open your authenticator app and enter the 6-digit code.
        </p>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="6-digit code"
          name="code"
          value={code}
          onChange={setCode}
          required
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Verifying…" : "Verify"}
        </Button>
      </form>
    </CardShell>
  );
}
