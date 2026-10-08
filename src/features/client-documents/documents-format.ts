/** Date added as people read it, in Melbourne time (CLAUDE.md §7): "2 Oct 2026". */
export function formatDateAdded(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Melbourne",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day} ${parts.month} ${parts.year}`;
}
