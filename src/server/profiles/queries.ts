/**
 * `profiles` domain query contract (CHG-023), in the same data-source-adapter
 * shape as the other `src/server/<domain>/queries.ts` contracts
 * (ARCHITECTURE.md §3.2). Screens import from here, never from `src/mocks`.
 */
import { createClient } from "@/lib/supabase/server";
import * as mock from "@/mocks/queries/profiles";
import { getDataSourceMode } from "@/server/data-source";

import { CONTACT_COLUMNS, contactFromRow } from "./contact-details";

export type { FamilyContactDetails } from "@/mocks/queries/profiles";

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
