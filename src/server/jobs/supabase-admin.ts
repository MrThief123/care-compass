import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Service-role Supabase client for background jobs — bypasses RLS entirely.
 * Only import this from src/server/jobs/** (enforced by eslint.config.mjs);
 * every other request path must query through src/lib/supabase/server.ts so
 * RLS stays the authorisation boundary (ADR-02).
 */
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local to run jobs that need service-role access.",
    );
  }

  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
