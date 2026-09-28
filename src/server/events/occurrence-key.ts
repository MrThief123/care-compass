/**
 * `${eventId}:${originalStartISO}` (`home-routes.ts`): the event id is a bare hex id, which
 * never contains ':', unlike the ISO instant that follows it — so splitting on the first ':'
 * always finds the right boundary. Shared by `actions.ts` and `queries.ts`; kept out of
 * `actions.ts` because a `"use server"` file may only export async functions.
 */
const KEY_PATTERN = /^([0-9a-f-]{36}):(.+)$/i;

export function parseOccurrenceKey(
  key: string,
): { eventId: string; originalStart: string } | undefined {
  const match = KEY_PATTERN.exec(key);
  return match ? { eventId: match[1]!, originalStart: match[2]! } : undefined;
}
