/**
 * Pure mapping between the Family info form and a `profiles` row (FAM-12). No
 * I/O, so both the query and the action use it and it can be tested alone.
 */
import type { FamilyContactDetails } from "@/mocks/queries/profiles";

import type { FamilyInfoValues } from "./contact-schema";

export interface ContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

/** The columns a Family member may change (mirrors the grant in 20260925010000_profiles_self_update.sql). */
export const CONTACT_COLUMNS = "id, first_name, last_name, phone, email, address" as const;

/**
 * The form has one Name field and the table has two columns. The name splits
 * at the first space (the rest is the last name), and a name is shown as the two
 * joined by a space, so what is saved reads back exactly as it was typed.
 */
export function splitName(name: string): { first_name: string; last_name: string | null } {
  const trimmed = name.trim();
  const at = trimmed.indexOf(" ");
  if (at === -1) return { first_name: trimmed, last_name: null };
  return { first_name: trimmed.slice(0, at), last_name: trimmed.slice(at + 1).trim() || null };
}

/** The values a save writes: trimmed, with a blank stored as null. */
export function contactRowValues(values: FamilyInfoValues) {
  return {
    ...splitName(values.name),
    phone: values.phone === "" ? null : values.phone,
    email: values.email === "" ? null : values.email,
    address: values.address === "" ? null : values.address,
  };
}

/** A row as the contract returns it: a missing value is left out, not an empty string (CHG-023). */
export function contactFromRow(row: ContactRow): FamilyContactDetails {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
  return {
    profileId: row.id,
    name,
    ...(row.phone && { phone: row.phone }),
    ...(row.email && { email: row.email }),
    ...(row.address && { address: row.address }),
  };
}
