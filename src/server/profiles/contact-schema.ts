import { z } from "zod";

/** 8 to 12 digits; only digits, spaces, `+` and brackets allowed (FD-03). */
function isPhone(value: string) {
  const digits = value.replace(/\D/g, "").length;
  return /^[\d\s+()]+$/.test(value) && digits >= 8 && digits <= 12;
}

/**
 * Family info card (FAM-UI-06 FD-03), moved here by FAM-12 so the screen and
 * the Server Action check the same rules (FAM-12 FD-02). Blank phone, email
 * and address are allowed.
 */
export const familyInfoSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || isPhone(value), "Enter a phone number like 0412 345 678."),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Enter an email address like name@example.com.",
    ),
  address: z.string().trim(),
});

export type FamilyInfoValues = z.infer<typeof familyInfoSchema>;
