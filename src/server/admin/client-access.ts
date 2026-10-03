import { notFound } from "next/navigation";
import { z } from "zod";

import { getDataSourceMode } from "@/server/data-source";

const ClientIdSchema = z.guid();

/**
 * ADM-11 (FD-03): an admin may open a client only when RLS lets them read it (their
 * organisation's, not removed). No readable row, a malformed id or a database error all show the
 * not-found page, never a redirect and never data. Family keeps `assertClientAccess`. Under
 * `DATA_SOURCE=mock` it does nothing (FD-06).
 */
export async function assertAdminClientAccess(clientId: string): Promise<void> {
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
  notFound();
}
