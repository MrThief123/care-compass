/**
 * Organisation-settings validation (ADM-10), shared by the screen and the Server Action so both
 * give the same messages. ABN: 11 digits, spaces allowed, no checksum (FD-03).
 */
import { z } from "zod";

import { australianPhoneError } from "@/lib/phone/au-phone";

export const organisationSettingsSchema = z.object({
  name: z.string().trim().min(1, "Enter an organisation name."),
  abn: z
    .string()
    .trim()
    .refine(
      (value) => /^[0-9 ]+$/.test(value) && value.replace(/ /g, "").length === 11,
      "Enter an ABN with 11 digits.",
    ),
  phone: z
    .string()
    .trim()
    .min(1, "Enter a phone number.")
    .superRefine((value, ctx) => {
      const message = australianPhoneError(value);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
  address: z.string().trim().min(1, "Enter an address."),
});
export type OrganisationSettingsValues = z.infer<typeof organisationSettingsSchema>;

/** '54123456789' or '54 123 456 789' -> '54 123 456 789'. Call only on a validated ABN. */
export function formatAbn(abn: string): string {
  const digits = abn.replace(/ /g, "");
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8), digits.slice(8, 11)].join(
    " ",
  );
}
