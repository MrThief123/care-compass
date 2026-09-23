"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { verifyMfaCode } from "@/server/auth/actions";

export interface MfaEnrollFormProps {
  factorId: string;
  qrCode: string;
  secret: string;
}

/** AC-09: admin scans the QR (or enters the secret) and confirms with a 6-digit code to activate it. */
export function MfaEnrollForm({ factorId, qrCode, secret }: MfaEnrollFormProps) {
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
        <h1 className="text-title-page text-text-primary">Set up two-factor authentication</h1>
        <p className="text-body-default text-text-secondary">
          Admin accounts require an authenticator app (OQ-08). Scan the code below, or enter the key
          manually.
        </p>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returns raw SVG markup, not an optimizable asset URL */}
      <img
        src={`data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`}
        alt="Scan with your authenticator app"
        width={200}
        height={200}
      />

      <p className="break-all text-body-small text-text-secondary">
        Manual entry key: <span className="font-mono">{secret}</span>
      </p>

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
          {isPending ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>
    </CardShell>
  );
}
