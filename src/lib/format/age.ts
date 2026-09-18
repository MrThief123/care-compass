/**
 * Whole years elapsed between a date of birth and a reference date
 * (default: now), business logic in Australia/Melbourne (CLAUDE.md §7).
 */
const MELBOURNE_TIME_ZONE = "Australia/Melbourne";

function melbourneYmd(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: MELBOURNE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(lookup.year), month: Number(lookup.month), day: Number(lookup.day) };
}

export function ageFromDob(dob: string | Date, referenceDate: string | Date = new Date()): number {
  const birth = melbourneYmd(typeof dob === "string" ? new Date(dob) : dob);
  const reference = melbourneYmd(
    typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate,
  );

  let age = reference.year - birth.year;
  const birthdayNotYetReached =
    reference.month < birth.month || (reference.month === birth.month && reference.day < birth.day);
  if (birthdayNotYetReached) {
    age -= 1;
  }
  return age;
}
