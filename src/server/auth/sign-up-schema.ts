import { z } from "zod";

import { requiredText } from "@/components/shared/forms/validation";

/**
 * F0-17 sign-up input. One schema for the form (field errors as the person types) and for
 * the `signUp` Server Action (the trust boundary), so the two can never disagree
 * (CLAUDE.md §7). Unknown keys are stripped, so a crafted request carrying an
 * organisation or client id (AC-06) is never read, whatever the database would do with it.
 */

/** Supabase Auth's minimum (`minimum_password_length` in supabase/config.toml). */
export const MIN_PASSWORD_LENGTH = 6;

export const ACCOUNT_TYPES = ["family", "organisation"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

const shared = {
  firstName: requiredText("Your first name"),
  lastName: requiredText("Your last name"),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
  confirmPassword: z.string().min(1, "Confirm your password."),
};

const familySchema = z.object({
  accountType: z.literal("family"),
  ...shared,
  clientFirstName: requiredText("Their first name"),
  clientLastName: requiredText("Their last name"),
});

const organisationSchema = z.object({
  accountType: z.literal("organisation"),
  ...shared,
  organisationName: requiredText("Organisation name"),
});

export const PASSWORDS_DO_NOT_MATCH = "Passwords do not match.";

export const SignUpInputSchema = z
  .discriminatedUnion("accountType", [familySchema, organisationSchema], {
    error: "Choose the type of account.",
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof SignUpInputSchema>;
