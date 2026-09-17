/**
 * Format a whole-dollar amount, e.g. formatMoney(14880) -> "$14,880",
 * formatMoney(6000, { showSign: true }) -> "+$6,000" (used for fund
 * top-ups in Budget History). Money is `numeric(12,2)` in the database
 * (CLAUDE.md §7); the fixtures and every current design figure are whole
 * dollars, so this formatter rounds to the nearest dollar.
 */
export interface FormatMoneyOptions {
  /** Prefix a '+' for positive amounts (e.g. a fund top-up). Default false. */
  showSign?: boolean;
}

export function formatMoney(amount: number, options: FormatMoneyOptions = {}): string {
  const { showSign = false } = options;
  const rounded = Math.round(Math.abs(amount));
  const formatted = rounded.toLocaleString("en-AU");
  const sign = amount < 0 ? "-" : showSign && amount > 0 ? "+" : "";
  return `${sign}$${formatted}`;
}
