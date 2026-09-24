import { redirect } from "next/navigation";

import { getPrimaryTotpFactorId } from "@/server/auth/queries";

import { MfaVerifyForm } from "./mfa-verify-form";

/** Reached only via the route guard, for a signed-in admin with a verified TOTP factor (AC-10). */
export default async function MfaVerifyPage() {
  const factorId = await getPrimaryTotpFactorId();

  if (!factorId) {
    redirect("/mfa/enroll");
  }

  return <MfaVerifyForm factorId={factorId} />;
}
