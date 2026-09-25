/**
 * `profiles` domain query contract (CHG-023), in the same data-source-adapter
 * shape as the other `src/server/<domain>/queries.ts` contracts
 * (ARCHITECTURE.md §3.2). Screens import from here, never from `src/mocks`.
 */
import * as mock from "@/mocks/queries/profiles";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";

export type { FamilyContactDetails } from "@/mocks/queries/profiles";

/** The signed-in family member's contact details, as Family · Settings shows them. */
export async function getFamilyContactDetails(
  profileId: string,
): Promise<mock.FamilyContactDetails> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getFamilyContactDetails(profileId);
  }
  notImplementedForSupabase("profiles", "getFamilyContactDetails");
}
