/**
 * One Australian phone rule for every settings form (CHG-038, ADM-10 FD-10).
 *
 * Accepted once spaces, hyphens and brackets are ignored: `0` or `+61` then a landline/mobile prefix
 * (2, 3, 4, 7, 8) and 8 more digits; 1300/1800 with 6 more digits (with or without the 0/+61); and
 * `13` plus 4 digits. Nothing checks that a number is assigned. Blank is not this module's concern:
 * each form decides whether a phone is required. The database repeats the rule in
 * `admin_update_organisation`.
 */
export const AU_PHONE_FORMAT_MESSAGE =
  "Enter an Australian phone number, like 03 9555 0102 or +61 3 9555 0102.";
export const AU_PHONE_LETTERS_MESSAGE = "A phone number can only have digits, spaces, + ( ) and -.";

const ALLOWED_CHARACTERS = /^[0-9+() -]+$/;
const AU_PHONE = /^(?:(?:0|\+61)[23478]\d{8}|(?:0|\+61)?1[38]00\d{6}|13\d{4})$/;

export function isAustralianPhone(phone: string): boolean {
  return AU_PHONE.test(phone.trim().replace(/[ ()-]/g, ""));
}

/** The message to show for a filled-in phone that is not an Australian number, else `null`. */
export function australianPhoneError(phone: string): string | null {
  const value = phone.trim();
  if (value === "") return null;
  if (!ALLOWED_CHARACTERS.test(value)) return AU_PHONE_LETTERS_MESSAGE;
  return isAustralianPhone(value) ? null : AU_PHONE_FORMAT_MESSAGE;
}
