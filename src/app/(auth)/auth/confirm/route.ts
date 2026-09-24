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
  const next = searchParams.get("next") ?? "/reset-password";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/sign-in?reason=reset-link-expired", request.url));
}
