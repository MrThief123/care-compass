import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { CardShell } from "@/components/ui/card-shell";
import { enrollMfaFactor } from "@/server/auth/actions";

import { MfaEnrollForm } from "./mfa-enroll-form";

/** Reached only via the route guard, for a signed-in admin with no verified TOTP factor (AC-09). */
export default async function MfaEnrollPage() {
  const result = await enrollMfaFactor();

  if (!result.ok) {
    return (
      <CardShell>
        <InlineAlert>{result.error.message}</InlineAlert>
      </CardShell>
    );
  }

  return (
    <MfaEnrollForm
      factorId={result.data.factorId}
      qrCode={result.data.qrCode}
      secret={result.data.secret}
    />
  );
}
