import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { resolveRoleHomePath } from "@/server/auth/routing";

import { SignUpForm } from "./sign-up-form";

/**
 * Public. A signed-in user who opens it is sent to their own home instead (PRD.md F0-17
 * Error / Edge Cases); a signed-in user with no active profile stays here and can finish
 * or leave.
 */
export default async function SignUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_active) {
      redirect(await resolveRoleHomePath(supabase, profile.id, profile.role));
    }
  }

  return <SignUpForm />;
}
