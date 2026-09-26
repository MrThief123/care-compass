/**
 * `profiles` domain query contract (CHG-023), in the same data-source-adapter
 * shape as the other `src/server/<domain>/queries.ts` contracts
 * (ARCHITECTURE.md §3.2). Screens import from here, never from `src/mocks`.
 */
import { createClient } from "@/lib/supabase/server";
import * as mock from "@/mocks/queries/profiles";
import { getDataSourceMode } from "@/server/data-source";

import { CONTACT_COLUMNS, contactFromRow } from "./contact-details";

export type { CarerContactDetails, FamilyContactDetails } from "@/mocks/queries/profiles";

/**
 * The signed-in family member's contact details, as Family · Settings shows them.
 * With `DATA_SOURCE=supabase` this reads the `profiles` row as the signed-in user
 * (RLS, FAM-12); a row that is not theirs is not returned, so it throws.
 */
export async function getFamilyContactDetails(
  profileId: string,
): Promise<mock.FamilyContactDetails> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getFamilyContactDetails(profileId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(CONTACT_COLUMNS)
    .eq("id", profileId)
    .maybeSingle();
  // The message names no profile or value: it may reach a log (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getFamilyContactDetails: profile not found.");
  return contactFromRow(data);
}

/**
 * The signed-in carer's own details, as Carer · Settings shows them (CAR-UI-04
 * FD-02). With `DATA_SOURCE=supabase` this reads the `profiles` row as the
 * signed-in user; CAR-09 verifies it against RLS.
 */
export async function getCarerContactDetails(
  profileId: string,
): Promise<mock.CarerContactDetails> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getCarerContactDetails(profileId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, email, job_title")
    .eq("id", profileId)
    .maybeSingle();
  // The message names no profile or value: it may reach a log (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getCarerContactDetails: profile not found.");
  return {
    profileId: data.id,
    name: [data.first_name, data.last_name].filter(Boolean).join(" "),
    ...(data.phone && { phone: data.phone }),
    ...(data.email && { email: data.email }),
    ...(data.job_title && { role: data.job_title }),
  };
}
