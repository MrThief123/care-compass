/**
 * Display a person's name.
 *
 * PD-038 (answering OQ-13, CONFIRMED 2026-09-17): staff/carer names are
 * stored as first + last and **displayed in full everywhere** — this
 * supersedes the earlier "Aisha R." (first name + surname initial)
 * abbreviation shown in the current design mockups. See feature
 * DECISIONS.md FD-01.
 */
export function displayName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, " ");
}
