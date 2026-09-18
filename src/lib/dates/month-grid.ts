import type { LocalDate } from "./week-range";

export interface MonthGridCell {
  date: LocalDate;
  inMonth: boolean;
}

/** A Monday-start week of 7 cells. */
export type MonthGridWeek = MonthGridCell[];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatLocalDate(date: Date): LocalDate {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function parseLocalDate(value: LocalDate): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

/**
 * A 6×7 Monday-start grid covering the month containing `date`, including
 * the leading/trailing out-of-month days needed to fill whole weeks
 * (UI-01 Scope: `monthGrid(date)`).
 */
export function monthGrid(date: LocalDate | Date): MonthGridWeek[] {
  const anchor = typeof date === "string" ? parseLocalDate(date) : date;
  const targetMonth = anchor.getUTCMonth();
  const targetYear = anchor.getUTCFullYear();

  const firstOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
  const daysSinceMonday = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - daysSinceMonday);

  const weeks: MonthGridWeek[] = [];
  const cursor = new Date(gridStart);
  for (let week = 0; week < 6; week++) {
    const days: MonthGridCell[] = [];
    for (let day = 0; day < 7; day++) {
      days.push({ date: formatLocalDate(cursor), inMonth: cursor.getUTCMonth() === targetMonth });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}
