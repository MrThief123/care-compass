/**
 * Organisation-settings validation (ADM-10), shared by the screen and the Server Action so both
 * give the same messages. ABN: 11 digits, spaces allowed, no checksum (FD-03).
 */
import { z } from "zod";

const PHONE_FORMAT = "Enter an Australian phone number, like 03 9555 0102 or +61 3 9555 0102.";
const PHONE_LETTERS = "A phone number can only have digits, spaces, + ( ) and -.";

/**
 * Australian numbers only (AC-08, FD-10): 0X XXXX XXXX (02, 03, 04, 07, 08) or the same with +61 and
 * no leading 0, 1300/1800 XXX XXX, and 13 XX XX. Spaces, hyphens and brackets are ignored. The
 * database repeats this check in `admin_update_organisation`.
 */
const AU_PHONE = /^(?:(?:0|\+61)[23478]\d{8}|(?:0|\+61)?1[38]00\d{6}|13\d{4})$/;

export function isAustralianPhone(phone: string): boolean {
  return AU_PHONE.test(phone.replace(/[ ()-]/g, ""));
}

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
    .refine((value) => /^[0-9+() -]+$/.test(value), PHONE_LETTERS)
    .refine(isAustralianPhone, PHONE_FORMAT),
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
