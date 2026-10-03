import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "./forgot-password/forgot-password-form";
import { MfaEnrollForm } from "./mfa/enroll/mfa-enroll-form";
import { MfaVerifyForm } from "./mfa/verify/mfa-verify-form";
import { ResetPasswordForm } from "./reset-password/reset-password-form";
import { SetPasswordForm } from "./set-password/set-password-form";
import { SignInForm } from "./sign-in/sign-in-form";
import { SignUpForm } from "./sign-up/sign-up-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/server/auth/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  setPassword: vi.fn(),
  verifyMfaCode: vi.fn(),
  enrollMfaFactor: vi.fn(),
}));

/**
 * F0-21 AC-05 (unit half of T-06). The server-rendered HTML is what a browser submits when someone
 * presses Enter or Sign in before React has hydrated. A <form> with no method submits as GET and
 * puts every named field — email, password, TOTP code — into the URL (history, server logs,
 * Referer). Each auth form must render method="post" so the fallback submit carries them in the
 * body. The e2e half (tests/e2e/auth-hardening.spec.ts) submits with JavaScript off.
 */
const FORMS = [
  ["sign-in", <SignInForm key="a" />],
  ["sign-up", <SignUpForm key="b" />],
  ["forgot-password", <ForgotPasswordForm key="c" />],
  ["reset-password", <ResetPasswordForm key="d" />],
  ["set-password", <SetPasswordForm key="g" />],
  ["mfa/verify", <MfaVerifyForm key="e" factorId="factor-1" />],
  [
    "mfa/enroll",
    <MfaEnrollForm key="f" factorId="factor-1" qrCode="data:image/png;base64,AA==" secret="ABC" />,
  ],
] as const;

describe("[F0-21][AC-05] auth forms never submit credentials in a URL", () => {
  it.each(FORMS)(
    "[F0-21][AC-05] T-06 the %s form renders method=post before hydration",
    (_, form) => {
      const html = renderToStaticMarkup(form);
      const formTags = html.match(/<form\b[^>]*>/g) ?? [];
      expect(formTags.length).toBeGreaterThan(0);
      for (const tag of formTags) {
        expect(tag).toMatch(/\bmethod="post"/);
      }
    },
  );
});
