"use server";

/**
 * `clients` domain Server Actions (FAM-13). Validated with Zod at the trust
 * boundary (ARCHITECTURE.md §12.4); result shape per ARCHITECTURE.md §4, never
 * throwing to the client for an expected failure. Authority is the database's:
 * `transfer_client_organisation` refuses anyone who is not a family member of the
 * client (OQ-16), so this action is not the only lock.
 */
import { z } from "zod";

import { getDataSourceMode } from "@/server/data-source";

export type ClientActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "VALIDATION" | "NOT_ALLOWED" | "NOT_AVAILABLE" | "UNEXPECTED";
        message: string;
      };
    };

// `guid`, not `uuid`: Postgres accepts any 8-4-4-4-12 hex id, and seed ids need not carry RFC version bits.
const ChangeOrganisationInputSchema = z.object({
  clientId: z.guid(),
  newOrganisationId: z.guid(),
});

const FAILED = "Couldn't change the organisation. Try again.";

/**
 * AC-01, AC-06: moves the client to another organisation through the single
 * `transfer_client_organisation` call (one transaction: history kept, assignments
 * ended, future shifts cancelled, the old organisation loses access at once).
 * With `DATA_SOURCE=mock` (Phase 1 screens) nothing can change, and it says so.
 */
export async function changeClientOrganisation(
  clientId: string,
  newOrganisationId: string,
): Promise<ClientActionResult> {
  if (getDataSourceMode() === "mock") {
    return {
      ok: false,
      error: {
        code: "NOT_AVAILABLE",
        message: "Choosing a new organisation is not available yet.",
      },
    };
  }

  const parsed = ChangeOrganisationInputSchema.safeParse({ clientId, newOrganisationId });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Choose an organisation from the list." },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.rpc("transfer_client_organisation", {
      p_client_id: parsed.data.clientId,
      p_new_org_id: parsed.data.newOrganisationId,
    });

    if (!error) return { ok: true, data: undefined };
    // Fixed messages by error code: the database's text may name a client or organisation.
    switch (error.code) {
      case "42501":
        return {
          ok: false,
          error: {
            code: "NOT_ALLOWED",
            message: "Only the client's family can change the organisation.",
          },
        };
      case "P0002":
        return {
          ok: false,
          error: {
            code: "UNEXPECTED",
            message: "That organisation is no longer available. Choose another.",
          },
        };
      case "22023":
        return {
          ok: false,
          error: { code: "UNEXPECTED", message: "That is already the current organisation." },
        };
      default:
        return { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
    }
  } catch (error) {
    // A feature tag and the error's class only: the message may carry client data (ARCHITECTURE.md §12.5).
    console.error(
      "[clients] changeClientOrganisation failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: { code: "UNEXPECTED", message: FAILED } };
  }
}
