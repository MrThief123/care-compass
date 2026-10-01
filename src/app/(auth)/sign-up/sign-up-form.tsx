"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ChipGroup } from "@/components/shared/forms/chip-group";
import { Field } from "@/components/shared/forms/field";
import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { fieldErrors, type FieldErrors } from "@/components/shared/forms/validation";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { signUp } from "@/server/auth/actions";
import { SignUpInputSchema, type AccountType } from "@/server/auth/sign-up-schema";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "family", label: "Family member" },
  { value: "organisation", label: "Organisation" },
];

/**
 * AC-01 to AC-04, AC-08: a public sign-up form built from the same card, field and button
 * components as `/sign-in`. Only the fields for the chosen account type exist, so hidden
 * fields are never submitted. There is no carer option: carers are invited (PD-040, PD-057).
 */
export function SignUpForm() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("family");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<{ message: string; emailExists: boolean } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const shared = { accountType, firstName, lastName, email, password, confirmPassword };
    const values =
      accountType === "family"
        ? { ...shared, clientFirstName, clientLastName }
        : { ...shared, organisationName };

    const checked = fieldErrors(SignUpInputSchema, values);
    if (!checked.ok) {
      setErrors(checked.errors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await signUp(checked.data);
      if (!result.ok) {
        if (result.error.fieldErrors) setErrors(result.error.fieldErrors);
        setFormError({
          message: result.error.message,
          emailExists: result.error.code === "EMAIL_EXISTS",
        });
        return;
      }
      router.push(result.data.redirectTo);
    });
  };

  return (
    <CardShell className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-page text-text-primary">Create an account</h1>
        <p className="text-body-default text-text-secondary">Set up your Care Compass account.</p>
      </div>

      {formError && (
        <InlineAlert>
          {formError.message}
          {formError.emailExists && (
            <>
              {" "}
              <Link href="/sign-in" className="underline">
                Sign in
              </Link>{" "}
              or{" "}
              <Link href="/forgot-password" className="underline">
                reset your password
              </Link>
              .
            </>
          )}
        </InlineAlert>
      )}

      <form method="post" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <ChipGroup
            legend="Account type"
            options={ACCOUNT_TYPE_OPTIONS}
            value={accountType}
            onChange={(value) => {
              setAccountType(value as AccountType);
              setErrors({});
            }}
          />
          <p className="text-body-small text-text-secondary">
            Carers: ask your organisation to invite you.
          </p>
        </div>

        <Field
          label="Your first name"
          name="firstName"
          value={firstName}
          onChange={setFirstName}
          error={errors.firstName}
          required
          disabled={isPending}
        />
        <Field
          label="Your last name"
          name="lastName"
          value={lastName}
          onChange={setLastName}
          error={errors.lastName}
          required
          disabled={isPending}
        />

        {accountType === "family" ? (
          <>
            <Field
              label="Their first name"
              name="clientFirstName"
              value={clientFirstName}
              onChange={setClientFirstName}
              error={errors.clientFirstName}
              hint="The person being cared for."
              required
              disabled={isPending}
            />
            <Field
              label="Their last name"
              name="clientLastName"
              value={clientLastName}
              onChange={setClientLastName}
              error={errors.clientLastName}
              required
              disabled={isPending}
            />
          </>
        ) : (
          <Field
            label="Organisation name"
            name="organisationName"
            value={organisationName}
            onChange={setOrganisationName}
            error={errors.organisationName}
            required
            disabled={isPending}
          />
        )}

        <Field
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          required
          disabled={isPending}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          required
          disabled={isPending}
        />
        <Field
          label="Confirm password"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          required
          disabled={isPending}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creating your account…" : "Create an account"}
        </Button>
      </form>

      <Link href="/sign-in" className="text-body-default text-text-brand underline">
        Already have an account? Sign in
      </Link>
    </CardShell>
  );
}
