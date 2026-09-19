/**
 * Family routes this feature links between (ARCHITECTURE.md §3.1).
 * Occurrence keys are `${eventId}:${originalStartISO}` (ARCHITECTURE.md
 * §6.2), so they contain `:` and `+` and must be URL-encoded in a path.
 */

export function taskLogHref(clientId: string): string {
  return `/family/${encodeURIComponent(clientId)}/tasks`;
}

export function taskDetailHref(clientId: string, occurrenceKey: string): string {
  return `${taskLogHref(clientId)}/${encodeURIComponent(occurrenceKey)}`;
}

/** The Edit link on Task detail goes to the edit-event route for the occurrence's event. */
export function editEventHref(clientId: string, eventId: string): string {
  return `/family/${encodeURIComponent(clientId)}/events/${encodeURIComponent(eventId)}/edit`;
}

/**
 * Route params can arrive encoded or already decoded depending on the
 * runtime. A contract key never contains `%`, so decoding twice is safe;
 * a malformed sequence is returned as given rather than thrown.
 */
export function decodeOccurrenceKey(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
