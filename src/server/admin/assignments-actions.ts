"use server";

/**
 * `admin` carer-client assignment Server Action (ADM-08). Validated with Zod at the trust boundary
 * (ARCHITECTURE.md §12.4); result shape per ARCHITECTURE.md §4 — never throw to the client for an
 * expected failure. Authorisation lives in `admin_end_carer_assignment` (AAL2 admin of the
 * client's organisation, carer in the same organisation); this only maps its refusal.
 */
import { z } from "zod";

import { removeMockAssignment } from "@/server/admin/assignments-mock-store";
import { getDataSourceMode } from "@/server/data-source";

export type RemoveAssignmentResult =
  | { ok: true; data: { endedShifts: number } }
  | {
      ok: false;
      error: { code: "VALIDATION" | "UNAUTHORISED" | "UNEXPECTED"; message: string };
    };

const RemoveSchema = z.object({
  carerId: z.string().trim().min(1),
  clientId: z.string().trim().min(1),
});

const REMOVE_FAILED = "Couldn't remove this client. Try again.";
const NOT_ALLOWED = "You can't remove this client from this carer.";

export async function removeCarerAssignment(input: {
  carerId: string;
  clientId: string;
}): Promise<RemoveAssignmentResult> {
  const parsed = RemoveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION", message: REMOVE_FAILED } };
  }
  const { carerId, clientId } = parsed.data;

  if (getDataSourceMode() === "mock") {
    return { ok: true, data: { endedShifts: removeMockAssignment(carerId, clientId) } };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_end_carer_assignment", {
      p_carer_id: carerId,
      p_client_id: clientId,
    });
    if (error || data === null) {
      if (error?.code === "42501") {
        return { ok: false, error: { code: "UNAUTHORISED", message: NOT_ALLOWED } };
      }
      logFailure(error?.code);
      return { ok: false, error: { code: "UNEXPECTED", message: REMOVE_FAILED } };
    }
    return { ok: true, data: { endedShifts: data } };
  } catch (error) {
    logFailure(error instanceof Error ? error.name : undefined);
    return { ok: false, error: { code: "UNEXPECTED", message: REMOVE_FAILED } };
  }
}

/** A feature tag and an error code only: the message may carry client data (ARCHITECTURE.md §12.5). */
function logFailure(code: string | undefined) {
  console.error("[admin-assignments] removeCarerAssignment failed:", code ?? "unknown");
}
