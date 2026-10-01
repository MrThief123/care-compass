import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Exchanges the emailed reset link's OTP for a recovery session, then
 * redirects to `?next` (`/reset-password`). An expired/invalid link sends
 * the user back to sign-in with the option to request a new one
 * (PRD.md F0-07 Error/Edge Cases).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next =
    sameOriginUrl(searchParams.get("next"), request.url) ?? new URL(DEFAULT_NEXT, request.url);

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(next);
    }
  }

  return NextResponse.redirect(new URL("/sign-in?reason=reset-link-expired", request.url));
}

const DEFAULT_NEXT = "/reset-password";

/**
 * F0-21 FD-09: `?next` is untrusted. Resolving it against the request and comparing origins
 * rejects every off-site form (`https://…`, `//host`, `/\host`, `javascript:`) without
 * hand-matching them; anything that isn't this app falls back to the default.
 */
function sameOriginUrl(next: string | null, base: string): URL | null {
  if (!next) return null;
  try {
    const url = new URL(next, base);
    return url.origin === new URL(base).origin ? url : null;
  } catch {
    return null;
  }
}
