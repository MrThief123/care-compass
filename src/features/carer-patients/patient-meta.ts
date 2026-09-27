import type { CarerPatientRow } from "@/server/shifts/queries";

/** "78 years · Preston VIC", the card and header meta line. */
export function patientMeta({ age, suburb }: CarerPatientRow): string {
  return `${age} years · ${suburb}`;
}
