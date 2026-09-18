import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/** Create a Supabase client for Client Components. Queries run as the signed-in user via RLS. */
export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
