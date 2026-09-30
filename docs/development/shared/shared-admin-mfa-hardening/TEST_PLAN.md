# Test Plan — F0-20 Admin TOTP MFA hardening

## Approach
Tests first (TESTING.md §2), run red for the expected reason, then implement. Every new test is run 10 times in a row and the result recorded below (flakiness proof). Integration and e2e run against local Supabase only, with dedicated freshly created users; never against the hosted project and never against an account someone is using.

## Test levels used
- **unit / server-action** → `src/server/auth/mfa-actions.test.ts` (mocked Supabase)
- **component** → `src/app/(auth)/mfa/**/*.test.tsx`
- **integration** → `tests/integration/shared-admin-mfa-hardening.test.ts`
- **e2e** → `tests/e2e/admin-mfa.spec.ts`
- helper → `tests/helpers/totp.ts` (RFC 6238)

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | QR `src` is used as-is for a `data:` value and wrapped for raw SVG; manual key shown. | ☐ | NOT RUN |
| T-02 | AC-01 | e2e | The QR `<img>` actually loads in a real browser (natural width > 0). | ☐ | NOT RUN |
| T-03 | AC-02 | server-action | `Promise.all` of two `enrollMfaFactor()` both succeed with different friendly names. | ☐ | NOT RUN |
| T-04 | AC-02 | integration | Two concurrent enrolments against local Supabase both succeed. | ☐ | NOT RUN |
| T-05 | AC-03 | server-action | An old unverified factor is unenrolled; a fresh one and any verified one are not. | ☐ | NOT RUN |
| T-06 | AC-04 | component | The enrol page does not call `enrollMfaFactor` on server render; the client flow calls it exactly once on mount (also under StrictMode) and shows loading, then the QR. | ☐ | NOT RUN |
| T-07 | AC-04 | component | A failed enrolment shows the message and a retry button that enrols again. | ☐ | NOT RUN |
| T-08 | AC-05 | component | After a failed verify on the enrol form and on the verify form, the field is empty and focused and the error has `role="alert"`. | ☐ | NOT RUN |
| T-09 | AC-05 | e2e | A wrong code shows the error and clears the field. | ☐ | NOT RUN |
| T-10 | AC-06 | server-action | Validation message for a non-6-digit code; wrong code → `MFA_INVALID_CODE`; expired code → same; missing factor → `MFA_FACTOR_MISSING` message; correct → redirect `/admin/home`; nothing throws. | ☐ | NOT RUN |
| T-11 | AC-06 | integration | Real TOTP: enrol then verify succeeds; wrong code refused; verify against a deleted factor returns the missing-factor message. | ☐ | NOT RUN |
| T-12 | AC-07 | integration | Sign in → sent to `/mfa/enroll` → enrol and verify → sign out → sign in → `/mfa/verify` → verify → `/admin/home`. | ☐ | NOT RUN |
| T-13 | AC-07 | e2e | Same path in a browser using the on-page manual key, incl. repeated refreshes of the enrol page. | ☐ | NOT RUN |
| T-14 | AC-08 | integration | AAL1 admin session is redirected to `/mfa/verify`; family and carer are never gated; unenroll returns the admin to `/mfa/enroll`. | ☐ | NOT RUN |
| T-15 | AC-09 | unit | With console and logger spies, sign-in, sign-up and MFA actions (success and failure) log none of email, password, code or secret. | ☐ | NOT RUN |

## Regression scope
`npm run lint`, `npm run typecheck`, `npm run test` (full vitest), `npm run test:integration` and the auth e2e specs (`auth`, `sign-up`, `root-route`, `admin-mfa`) against local Supabase, on a port other than 3000.

## Test data
Fresh users and organisations created in each test through the service-role client and deleted afterwards. Not the seeded Priya.

## Flakiness record (10 consecutive runs)
Filled in at the end.
