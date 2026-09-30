/**
 * `clients` domain query contract. Authored by F0-15 (the first feature
 * needing client data), following the same data-source-adapter shape as
 * the `budget`/`events` contracts UI-00 authored (ARCHITECTURE.md §3.2).
 * Screens must import from here, never from `src/mocks` directly
 * (lint-enforced).
 */
import { redirect } from "next/navigation";
import { z } from "zod";

import { ageFromDob } from "@/lib/format/age";
import * as mock from "@/mocks/queries/clients";
import { getLandingPath } from "@/server/auth/queries";
import { getDataSourceMode } from "@/server/data-source";
import type { ClientInfoSection, ClientInfoSectionKind } from "@/types/domain";

// `guid`, not `uuid`: Postgres accepts any 8-4-4-4-12 hex id, and seed ids need not carry RFC version bits.
const ClientIdSchema = z.guid();

/** The order the sections are drawn in, with the database key and title of each. */
const SECTIONS: ReadonlyArray<{ kind: ClientInfoSectionKind; key: string; title: string }> = [
  { kind: "description", key: "description", title: "Description" },
  { kind: "habits", key: "habits", title: "Habits" },
  { kind: "medicalHistory", key: "medical_history", title: "Medical history" },
];

export type { ClientHeaderSummary, OrganisationChoice } from "@/mocks/queries/clients";

/**
 * The header every Family page opens with (F0-22): first and last name, age in
 * whole years (Australia/Melbourne), suburb and the organisation's name. A missing
 * date of birth, suburb or organisation leaves that field out. With
 * `DATA_SOURCE=supabase` RLS decides whether the client is readable; one that is
 * not, a malformed id or a database error throws a message naming no client.
 * The organisation name comes from `list_organisations_for_transfer` (family
 * members cannot read `organisations`, F0-22 FD-01); if that fails the header
 * is returned without it.
 */
export async function getClientHeaderSummary(clientId: string): Promise<mock.ClientHeaderSummary> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getClientHeaderSummary(clientId);
  }

  // The message names no client, id or date of birth (ARCHITECTURE.md §12.5).
  const failed = () => new Error("getClientHeaderSummary: could not load the client.");
  if (!ClientIdSchema.safeParse(clientId).success) throw failed();

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, date_of_birth, suburb, organisation_id")
    .eq("id", clientId)
    .maybeSingle();
  if (error || !row) throw failed();

  let organisationName: string | undefined;
  if (row.organisation_id) {
    const { data: organisations, error: organisationsError } = await supabase.rpc(
      "list_organisations_for_transfer",
      { p_client_id: clientId },
    );
    if (!organisationsError) {
      organisationName = organisations?.find((organisation) => organisation.is_current)?.name;
    }
  }

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    ...(row.date_of_birth ? { age: ageFromDob(row.date_of_birth) } : {}),
    ...(row.suburb ? { suburb: row.suburb } : {}),
    ...(organisationName ? { organisationName } : {}),
  };
}

/**
 * Sends the signed-in user to their own landing page unless they can read this
 * client (F0-22). RLS is the boundary; this is the redirect. A malformed id, no
 * readable row and a database error all redirect, never grant. No-op under
 * `DATA_SOURCE=mock`. A layout does not stop its page rendering, so a page that
 * must not fetch for an unlinked client calls this itself.
 */
export async function assertClientAccess(clientId: string): Promise<void> {
  if (getDataSourceMode() === "mock") return;

  if (ClientIdSchema.safeParse(clientId).success) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .maybeSingle();
    if (!error && data) return;
  }
  redirect(await getLandingPath());
}

/**
 * A client's Description, Habits and Medical history, in that order, as
 * Family · Info draws them (FAM-UI-04, CHG-018). A section that has never been
 * written is left out, so a client with none, or an unknown client, returns
 * `[]`. Read only; `saveClientInfoSection` (actions.ts) saves an edit. With
 * `DATA_SOURCE=supabase` RLS decides who sees anything (family, an admin of the
 * client's organisation, a carer whose shift has not ended).
 */
export async function getClientInfoSections(clientId: string): Promise<ClientInfoSection[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getClientInfoSections(clientId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_info_sections")
    .select("client_id, key, body, updated_at")
    .eq("client_id", clientId);
  // The message names no client or carer (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getClientInfoSections: could not load the sections.");

  return SECTIONS.flatMap(({ kind, key, title }) => {
    const row = data.find((r) => r.key === key);
    if (!row || row.body === null) return [];
    return [
      {
        id: `${row.client_id}:${key}`,
        clientId: row.client_id,
        kind,
        title,
        content: row.body,
        updatedAt: row.updated_at,
      },
    ];
  });
}

/**
 * The organisations a family can move the client to (FAM-13): every organisation
 * registered with Care Compass by name, with the client's current one flagged
 * (`isCurrent`, not choosable). Only id and name leave the database. With
 * `DATA_SOURCE=supabase` it calls `list_organisations_for_transfer`, which answers
 * only for a family member of the client; otherwise it throws.
 */
export async function getOrganisationChoices(clientId: string): Promise<mock.OrganisationChoice[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getOrganisationChoices(clientId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_organisations_for_transfer", {
    p_client_id: clientId,
  });
  // The message names no client (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getOrganisationChoices: could not load organisations.");
  return data.map(({ id, name, is_current }) => ({ id, name, isCurrent: is_current }));
}
