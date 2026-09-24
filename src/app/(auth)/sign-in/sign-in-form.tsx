"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { signIn } from "@/server/auth/actions";

export interface SignInFormProps {
  /** AC-06 (deactivated profile) or an expired reset link (PRD.md Error/Edge Cases). */
  notice?: string;
}

/** AC-01/AC-02/AC-03: email + password, generic error on failure (PRD.md F0-07 Security). */
export function SignInForm({ notice }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn({ email, password });
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
        <h1 className="text-title-page text-text-primary">Sign in</h1>
        <p className="text-body-default text-text-secondary">Sign in to Care Compass.</p>
      </div>

      {notice && <InlineAlert>{notice}</InlineAlert>}
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
        <Field
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={setPassword}
          required
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Link href="/forgot-password" className="text-body-default text-text-brand underline">
        Forgot password?
      </Link>
    </CardShell>
  );
}
