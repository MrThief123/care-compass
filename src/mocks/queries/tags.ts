/**
 * Mock (fixture-backed) implementation of the `tags` domain contract (F0-29). Read only by
 * `src/server/tags/` and the mock events contract — never imported by `src/app` or
 * `src/features`. The rules here (per-client lists, any-case names, A to Z) are the ones the
 * Supabase branch follows.
 */
import {
  CARE_EVENTS,
  CLIENT_TAGS,
  DOCUMENT_TAGS,
  DOCUMENTS,
  EVENT_DOCUMENTS,
  EVENT_TAGS,
} from "@/mocks/fixtures";
import { sortTagNames } from "@/server/tags/tag-input";

function own<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

function eventIsClients(clientId: string, eventId: string): boolean {
  return CARE_EVENTS.some((event) => event.id === eventId && event.clientId === clientId);
}

function documentIsClients(clientId: string, documentId: string): boolean {
  return [...DOCUMENTS, ...EVENT_DOCUMENTS].some(
    (document) => document.id === documentId && document.clientId === clientId,
  );
}

/** The client's spelling of each name, adding the names that are new (already validated). */
function resolveNames(clientId: string, names: readonly string[]): string[] {
  const list = (CLIENT_TAGS[clientId] ??= []);
  return names.map((name) => {
    const existing = list.find((tag) => tag.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    list.push(name);
    return name;
  });
}

export async function getClientTags(clientId: string): Promise<string[]> {
  return sortTagNames(own(CLIENT_TAGS, clientId) ?? []);
}

export async function getEventTags(clientId: string, eventId: string): Promise<string[]> {
  if (!eventIsClients(clientId, eventId)) return [];
  return sortTagNames(own(EVENT_TAGS, eventId) ?? []);
}

export async function getEventTagsByClient(clientId: string): Promise<Record<string, string[]>> {
  const byEvent: Record<string, string[]> = {};
  for (const event of CARE_EVENTS) {
    const tags = event.clientId === clientId ? own(EVENT_TAGS, event.id) : undefined;
    if (tags?.length) byEvent[event.id] = sortTagNames(tags);
  }
  return byEvent;
}

export async function getDocumentTagsByClient(clientId: string): Promise<Record<string, string[]>> {
  const byDocument: Record<string, string[]> = {};
  for (const [documentId, tags] of Object.entries(DOCUMENT_TAGS)) {
    if (tags.length && documentIsClients(clientId, documentId)) {
      byDocument[documentId] = sortTagNames(tags);
    }
  }
  return byDocument;
}

/** The ids of the client's events that carry `tag`, in any case. */
export function eventIdsWithTag(clientId: string, tag: string): Set<string> {
  const needle = tag.toLowerCase();
  return new Set(
    CARE_EVENTS.filter(
      (event) =>
        event.clientId === clientId &&
        (own(EVENT_TAGS, event.id) ?? []).some((name) => name.toLowerCase() === needle),
    ).map((event) => event.id),
  );
}

/** Replaces an event's tags. `names` is already validated. False for another client's event. */
export async function setEventTags(
  clientId: string,
  eventId: string,
  names: readonly string[],
): Promise<boolean> {
  if (!eventIsClients(clientId, eventId)) return false;
  EVENT_TAGS[eventId] = resolveNames(clientId, names);
  return true;
}

/** Replaces a document's tags. `names` is already validated. False for another client's document. */
export async function setDocumentTags(
  clientId: string,
  documentId: string,
  names: readonly string[],
): Promise<boolean> {
  if (!documentIsClients(clientId, documentId)) return false;
  DOCUMENT_TAGS[documentId] = resolveNames(clientId, names);
  return true;
}
