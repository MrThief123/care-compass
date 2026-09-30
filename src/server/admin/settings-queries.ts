import { ADMIN_SETTINGS } from "@/mocks/admin-settings";
import { getDataSourceMode } from "@/server/data-source";

export interface OrganisationSettings {
  name: string;
  abn: string;
  phone: string;
  address: string;
}
export interface AdminSettingsData {
  organisation: OrganisationSettings | null;
}

/**
 * The signed-in admin's own organisation (ADM-10). RLS scopes a plain `select` to the caller's
 * organisation (`organisations_select_member`); `null` when none is visible.
 */
export async function getAdminSettings(): Promise<AdminSettingsData> {
  if (getDataSourceMode() === "mock") return structuredClone(ADMIN_SETTINGS);

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisations")
    .select("name, abn, phone, address")
    .limit(1)
    .maybeSingle();
  // The message names no organisation (ARCHITECTURE.md §12.5).
  if (error) throw new Error("getAdminSettings: could not load the organisation.");
  if (!data) return { organisation: null };
  return {
    organisation: {
      name: data.name,
      abn: data.abn ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
    },
  };
}
