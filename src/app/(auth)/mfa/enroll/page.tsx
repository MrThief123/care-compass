import { MfaEnrollFlow } from "./mfa-enroll-flow";

/**
 * Reached only via the route guard, for a signed-in admin with no verified TOTP factor (AC-09).
 * Static on purpose: enrolment starts once from the browser (F0-20 AC-04), because a server
 * render can run several times per sign-in and each run would create its own factor.
 */
export default function MfaEnrollPage() {
  return <MfaEnrollFlow />;
}
