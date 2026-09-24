"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { requestPasswordReset } from "@/server/auth/actions";

/** AC-07/AC-08: same confirmation for a registered or unregistered email — no account enumeration. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset({ email });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <CardShell className="flex flex-col gap-4">
        <h1 className="text-title-page text-text-primary">Check your email</h1>
        <p className="text-body-default text-text-secondary">
          We&apos;ll email you a secure link to reset your password, if an account exists for that
          address.
        </p>
        <Link href="/sign-in" className="text-body-default text-text-brand underline">
          Back to sign in
        </Link>
      </CardShell>
    );
  }

  return (
    <CardShell className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-page text-text-primary">Reset your password</h1>
        <p className="text-body-default text-text-secondary">
          Enter your email and we&apos;ll send you a secure link.
        </p>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={setEmail}
          required
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <Link href="/sign-in" className="text-body-default text-text-brand underline">
        Back to sign in
      </Link>
    </CardShell>
  );
}
