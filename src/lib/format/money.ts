/**
 * Format a whole-dollar amount, e.g. formatMoney(14880) -> "$14,880", formatMoney(12.5) -> "$12.50",
 * formatMoney(6000, { showSign: true }) -> "+$6,000" (used for fund
 * top-ups in Budget History). Money is `numeric(12,2)` in the database
 * (CLAUDE.md §7). A whole amount shows no cents; any other shows two
 * ("$12.50"). Display only: arithmetic stays in SQL (F0-12).
 */
export interface FormatMoneyOptions {
  /** Prefix a '+' for positive amounts (e.g. a fund top-up). Default false. */
  showSign?: boolean;
}

export function formatMoney(amount: number, options: FormatMoneyOptions = {}): string {
  const { showSign = false } = options;
  const cents = Math.round(Math.abs(amount) * 100);
  const formatted =
    cents % 100 === 0
      ? (cents / 100).toLocaleString("en-AU")
      : (cents / 100).toLocaleString("en-AU", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const sign = amount < 0 ? "-" : showSign && amount > 0 ? "+" : "";
  return `${sign}$${formatted}`;
}
