"use server";

/**
 * `admin` organisation-settings Server Action (ADM-10). Validated with Zod at the trust boundary
 * (ARCHITECTURE.md §12.4); result shape per ARCHITECTURE.md §4, never throwing for an expected
 * failure. Writes only through `admin_update_organisation`, which takes no organisation id: the
 * organisation is the calling admin's own (FD-02).
 */
import { fieldErrors } from "@/components/shared/forms/validation";
import type { Database } from "@/lib/supabase/database.types";
import { getDataSourceMode } from "@/server/data-source";

import { formatAbn, organisationSettingsSchema } from "./settings-schema";

import type { OrganisationSettings } from "./settings-queries";

export type SettingsActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "VALIDATION" | "UNEXPECTED";
        message: string;
        /** Per-field messages, keyed by the form's field names. */
        fieldErrors?: Record<string, string>;
      };
    };

const SAVE_FAILED = "Couldn't save the organisation details. Try again.";

export async function updateOrganisationSettings(
  input: OrganisationSettings,
): Promise<SettingsActionResult<OrganisationSettings>> {
  const parsed = fieldErrors(organisationSettingsSchema, input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the highlighted fields.",
        fieldErrors: parsed.errors,
      },
    };
  }
  const values = { ...parsed.data, abn: formatAbn(parsed.data.abn) };

  if (getDataSourceMode() === "mock") return { ok: true, data: values };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("admin_update_organisation", {
        p_name: values.name,
        p_abn: values.abn,
        p_phone: values.phone,
        p_address: values.address,
      })
      .single<Database["public"]["Tables"]["organisations"]["Row"]>();
    if (error || !data) {
      logFailure(error?.code);
      return { ok: false, error: { code: "UNEXPECTED", message: SAVE_FAILED } };
    }
    return {
      ok: true,
      data: {
        name: data.name,
        abn: data.abn ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
      },
    };
  } catch (error) {
    logFailure(error instanceof Error ? error.name : undefined);
    return { ok: false, error: { code: "UNEXPECTED", message: SAVE_FAILED } };
  }
}

/** A feature tag and an error code only: the message may carry client data (ARCHITECTURE.md §12.5). */
function logFailure(code: string | undefined) {
  console.error("[admin-settings] updateOrganisationSettings failed:", code ?? "unknown");
}
