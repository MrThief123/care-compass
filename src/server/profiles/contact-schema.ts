import { z } from "zod";

import { requiredPhoneError } from "@/lib/phone/au-phone";

/**
 * Family info card (FAM-UI-06 FD-03), moved here by FAM-12 so the screen and
 * the Server Action check the same rules (FAM-12 FD-02). A blank email and
 * address are allowed; the phone is required and must be an Australian number (CHG-038, CHG-039).
 */
export const familyInfoSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  phone: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = requiredPhoneError(value);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
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

/** Carer My info card (CAR-09 FD-03): the family rules without address; Role is never editable (PD-054). */
export const carerInfoSchema = familyInfoSchema.omit({ address: true });

export type CarerInfoValues = z.infer<typeof carerInfoSchema>;
