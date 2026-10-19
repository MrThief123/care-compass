import { z } from "zod";

import { melbourneDateKey } from "@/lib/dates/melbourne-time";

/**
 * F0-28 client personal details: one schema for the sign-up group, the Family Settings card and
 * `saveClientDetails` (the trust boundary), so the three can never disagree (CLAUDE.md §7). Every
 * field is optional and trimmed; a blank one means "not set". The database repeats these checks
 * (`clients_*` constraints and `save_client_details`).
 */

export type ClientDetailKey =
  | "dateOfBirth"
  | "email"
  | "phone"
  | "address"
  | "suburb"
  | "emergencyContactName"
  | "emergencyContactRelationship"
  | "emergencyContactPhone";

/** What is saved for a client; a field that is not set is absent. */
export type ClientDetails = Partial<Record<ClientDetailKey, string>>;

/** Display order, labels and input types, shared by every form that edits these fields. */
export const CLIENT_DETAIL_FIELDS: ReadonlyArray<{
  key: ClientDetailKey;
  label: string;
  type: "date" | "email" | "tel" | "text";
}> = [
  { key: "dateOfBirth", label: "Date of birth", type: "date" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "address", label: "Address", type: "text" },
  { key: "suburb", label: "Suburb", type: "text" },
  { key: "emergencyContactName", label: "Emergency contact name", type: "text" },
  { key: "emergencyContactRelationship", label: "Relationship", type: "text" },
  { key: "emergencyContactPhone", label: "Emergency contact phone", type: "tel" },
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PHONE = /^[0-9 +()-]{6,20}$/;
const PHONE_MESSAGE = "Enter a valid phone number.";

/** Trims, turns blank into "not set", then applies `inner` to what is left. */
function optional(inner: z.ZodType<string, string>) {
  return z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined)
    .pipe(inner.optional());
}

function text(label: string, max: number) {
  return optional(z.string().max(max, `${label} must be ${max} characters or fewer.`));
}

function isRealDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
}

const phone = optional(
  z
    .string()
    .regex(PHONE, PHONE_MESSAGE)
    .refine((value) => (value.match(/\d/g) ?? []).length >= 6, PHONE_MESSAGE),
);

/** The zod type of each field, for schemas that embed them under other keys (sign-up). */
export const clientDetailsShape = {
  dateOfBirth: optional(
    z
      .string()
      .refine(isRealDate, "Enter a real date.")
      .refine((value) => value >= "1900-01-01", "Date of birth must be in 1900 or later.")
      // Today in Melbourne, read when the value is checked, not when the module loads.
      .refine(
        (value) => value <= melbourneDateKey(new Date().toISOString()),
        "Date of birth can't be in the future.",
      ),
  ),
  email: optional(
    z.email("Enter a valid email address.").max(254, "Email must be 254 characters or fewer."),
  ),
  phone,
  address: text("Address", 200),
  suburb: text("Suburb", 100),
  emergencyContactName: text("Emergency contact name", 100),
  emergencyContactRelationship: text("Relationship", 60),
  emergencyContactPhone: phone,
} satisfies Record<ClientDetailKey, z.ZodType>;

export const ClientDetailsInputSchema = z.object(clientDetailsShape);
export type ClientDetailsInput = z.input<typeof ClientDetailsInputSchema>;

/** True when at least one field is set. */
export function hasAnyClientDetail(details: ClientDetails): boolean {
  return Object.values(details).some((value) => value !== undefined && value !== "");
}
