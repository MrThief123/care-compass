/**
 * `auth` domain query contract. Wraps `src/mocks/current-user.ts` (the
 * mock session UI-00 established, PRD.md F0-15 "Inputs: Session profile")
 * so `src/app`/`src/features` never import `src/mocks` directly
 * (lint-enforced). `DATA_SOURCE=supabase` swaps this for the real Supabase
 * session in F0-07.
 */
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { Role } from "@/types/domain";

export type { CurrentUser } from "@/mocks/current-user";

export async function getCurrentUser(role: Role) {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    const mock = await import("@/mocks/current-user");
    return mock.getCurrentUser(role);
  }
  notImplementedForSupabase("auth", "getCurrentUser");
}
