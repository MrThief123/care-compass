/**
 * F0-28 `getClientDetails`: a client's personal details, read through the same data-source
 * adapter as the rest of the `clients` contract (ARCHITECTURE.md §3.2). With
 * `DATA_SOURCE=supabase` the existing `clients` select policies decide who reads them (family, an
 * assigned carer, an admin of the client's organisation).
 */
import { z } from "zod";

import * as mock from "@/mocks/queries/clients";
import { getDataSourceMode } from "@/server/data-source";

import type { ClientDetails } from "./client-details-schema";

export type { ClientDetails } from "./client-details-schema";

const ClientIdSchema = z.guid();

const COLUMNS =
  "date_of_birth, email, phone, address, suburb, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone";

/**
 * The client's details; a field that is not set is absent. An unreadable or unknown client, a
 * malformed id or a database error throws a message naming no client (ARCHITECTURE.md §12.5).
 */
export async function getClientDetails(clientId: string): Promise<ClientDetails> {
  if (getDataSourceMode() === "mock") {
    return mock.getClientDetails(clientId);
  }

  const failed = () => new Error("getClientDetails: could not load the details.");
  if (!ClientIdSchema.safeParse(clientId).success) throw failed();

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("clients")
    .select(COLUMNS)
    .eq("id", clientId)
    .maybeSingle();
  if (error || !row) throw failed();

  const details: ClientDetails = {
    dateOfBirth: row.date_of_birth ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    suburb: row.suburb ?? undefined,
    emergencyContactName: row.emergency_contact_name ?? undefined,
    emergencyContactRelationship: row.emergency_contact_relationship ?? undefined,
    emergencyContactPhone: row.emergency_contact_phone ?? undefined,
  };
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as ClientDetails;
}
