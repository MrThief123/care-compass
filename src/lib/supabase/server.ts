import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import { env } from "@/lib/env";

import { sessionCookieOptions } from "./cookie-options";
import type { Database } from "./database.types";

/**
 * Create a Supabase client for Server Components, Server Actions and Route
 * Handlers. Queries run as the signed-in user via RLS (auth.uid() from their
 * session cookie) — never with elevated privileges.
 *
 * Create a new client per request; never share one across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const host = await requestHost();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      // F0-21 AC-02: HttpOnly, SameSite=Lax, Secure in production.
      cookieOptions: sessionCookieOptions(host),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't write cookies. proxy.ts refreshes the
            // session on navigation, so this is safe to ignore here.
          }
        },
      },
    },
  );
}

/**
 * The request's Host, used only to leave `Secure` off on a loopback host. When it cannot be
 * read, the host is unknown and `sessionCookieOptions` keeps `Secure` on in production.
 */
async function requestHost(): Promise<string | null> {
  try {
    return (await headers()).get("host");
  } catch {
    return null;
  }
}
