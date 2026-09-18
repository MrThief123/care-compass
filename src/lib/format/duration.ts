/**
 * Format a duration given in minutes as "<n> hr <m> min", omitting either
 * half that is zero (e.g. 90 -> "1 hr 30 min", 60 -> "1 hr", 45 -> "45 min").
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 0) {
    throw new RangeError(`formatDuration: totalMinutes must be >= 0, got ${totalMinutes}`);
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
}
