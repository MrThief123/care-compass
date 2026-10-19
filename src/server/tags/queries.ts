/**
 * F0-29: the `tags` domain query contract. Screens import from here, never from `src/mocks`.
 * With `DATA_SOURCE=supabase` RLS decides what is readable: family, an assigned carer and an
 * admin of the client's organisation; a client the caller may not see has no tags. Every list of
 * names is A to Z, ignoring case. A database error throws a message naming no client
 * (ARCHITECTURE.md §12.5).
 */
import * as mock from "@/mocks/queries/tags";
import { getDataSourceMode } from "@/server/data-source";

import { sortTagNames } from "./tag-input";

// Any 8-4-4-4-12 hex id, as Postgres accepts (seed ids need not carry RFC version bits).
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TagRow = { tag: { name: string } | null };

async function supabaseClient() {
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}

/** Groups link rows by item id, each item's names A to Z. */
function groupNames<T extends TagRow>(rows: T[], idOf: (row: T) => string) {
  const byId: Record<string, string[]> = {};
  for (const row of rows) {
    if (row.tag) (byId[idOf(row)] ??= []).push(row.tag.name);
  }
  for (const id of Object.keys(byId)) byId[id] = sortTagNames(byId[id]!);
  return byId;
}

/** The client's tags, for the pickers and the Task log's Tag select. */
export async function getClientTags(clientId: string): Promise<string[]> {
  if (getDataSourceMode() === "mock") return mock.getClientTags(clientId);
  if (!ID_PATTERN.test(clientId)) return [];

  const supabase = await supabaseClient();
  const { data, error } = await supabase
    .from("client_tags")
    .select("name")
    .eq("client_id", clientId);
  if (error || !data) throw new Error("getClientTags: could not load the tags.");
  return sortTagNames(data.map((row) => row.name));
}

/** One event's tags, for Edit event; another client's event has none. */
export async function getEventTags(clientId: string, eventId: string): Promise<string[]> {
  if (getDataSourceMode() === "mock") return mock.getEventTags(clientId, eventId);
  if (!ID_PATTERN.test(clientId) || !ID_PATTERN.test(eventId)) return [];

  const supabase = await supabaseClient();
  const { data, error } = await supabase
    .from("care_event_tags")
    .select("event_id, tag:client_tags(name)")
    .eq("client_id", clientId)
    .eq("event_id", eventId);
  if (error || !data) throw new Error("getEventTags: could not load the tags.");
  return groupNames(data, (row) => row.event_id)[eventId] ?? [];
}

/** Every tagged event's tags, by event id, for the Task log's rows. */
export async function getEventTagsByClient(clientId: string): Promise<Record<string, string[]>> {
  if (getDataSourceMode() === "mock") return mock.getEventTagsByClient(clientId);
  if (!ID_PATTERN.test(clientId)) return {};

  const supabase = await supabaseClient();
  const { data, error } = await supabase
    .from("care_event_tags")
    .select("event_id, tag:client_tags(name)")
    .eq("client_id", clientId);
  if (error || !data) throw new Error("getEventTagsByClient: could not load the tags.");
  return groupNames(data, (row) => row.event_id);
}

/** Every tagged document's tags, by document id, for the Documents page. */
export async function getDocumentTagsByClient(clientId: string): Promise<Record<string, string[]>> {
  if (getDataSourceMode() === "mock") return mock.getDocumentTagsByClient(clientId);
  if (!ID_PATTERN.test(clientId)) return {};

  const supabase = await supabaseClient();
  const { data, error } = await supabase
    .from("document_tags")
    .select("document_id, tag:client_tags(name)")
    .eq("client_id", clientId);
  if (error || !data) throw new Error("getDocumentTagsByClient: could not load the tags.");
  return groupNames(data, (row) => row.document_id);
}
