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
| T-01 | AC-01 | component | QR `src` is used as-is for a `data:` value and wrapped for raw SVG; manual key shown. | ☑ | PASS |
| T-02 | AC-01 | e2e | The QR `<img>` actually loads in a real browser (natural width > 0). | ☑ | PASS |
| T-03 | AC-02 | server-action | `Promise.all` of two `enrollMfaFactor()` both succeed with different friendly names. | ☑ | PASS |
| T-04 | AC-02 | integration | Two concurrent enrolments against local Supabase both succeed. | ☑ | PASS |
| T-05 | AC-03 | server-action | An old unverified factor is unenrolled; a fresh one and any verified one are not. | ☑ | PASS |
| T-06 | AC-04 | component | The enrol page does not call `enrollMfaFactor` on server render; the client flow calls it exactly once on mount (also under StrictMode) and shows loading, then the QR. | ☑ | PASS |
| T-07 | AC-04 | component | A failed enrolment shows the message and a retry button that enrols again. | ☑ | PASS |
| T-08 | AC-05 | component | After a failed verify on the enrol form and on the verify form, the field is empty and focused and the error has `role="alert"`. | ☑ | PASS |
| T-09 | AC-05 | e2e | A wrong code shows the error and clears the field. | ☑ | PASS |
| T-10 | AC-06 | server-action | Validation message for a non-6-digit code; wrong code → `MFA_INVALID_CODE`; expired code → same; missing factor → `MFA_FACTOR_MISSING` message; correct → redirect `/admin/home`; nothing throws. | ☑ | PASS |
| T-11 | AC-06 | integration | Real TOTP: enrol then verify succeeds; wrong code refused; verify against a deleted factor returns the missing-factor message. | ☑ | PASS |
| T-12 | AC-07 | integration | Sign in → sent to `/mfa/enroll` → enrol and verify → sign out → sign in → `/mfa/verify` → verify → `/admin/home`. | ☑ | PASS |
| T-13 | AC-07 | e2e | Same path in a browser using the on-page manual key, incl. repeated refreshes of the enrol page. | ☑ | PASS |
| T-14 | AC-08 | integration | AAL1 admin session is redirected to `/mfa/verify`; family and carer are never gated; unenroll returns the admin to `/mfa/enroll`. | ☑ | PASS |
| T-15 | AC-09 | unit | With console and logger spies, sign-in, sign-up and MFA actions (success and failure) log none of email, password, code or secret. | ☑ | PASS |

## Regression scope
`npm run lint`, `npm run typecheck`, `npm run test` (full vitest), `npm run test:integration` and the auth e2e specs (`auth`, `sign-up`, `root-route`, `admin-mfa`) against local Supabase, on a port other than 3000.

## Test data
Fresh users and organisations created in each test through the service-role client and deleted afterwards. Not the seeded Priya.

## Flakiness record (10 consecutive runs)
Recorded 2026-10-01. Each set run sequentially, never in parallel (load causes false 5 s timeouts).

| Set | Tests | Consecutive runs | Result |
|---|---|---|---|
| Unit and component (`src/app/(auth)/mfa`, `src/server/auth/mfa-actions.test.ts`) | 22 | 10 | 10 of 10 passed (22/22 each) |
| Integration (`tests/integration/shared-admin-mfa-hardening.test.ts`) | 5 | 10 | 10 of 10 passed (5/5 each) |
| E2E (`tests/e2e/admin-mfa.spec.ts`, local Supabase, production build, port 3210) | 3 | 10 | 10 of 10 passed (3/3 each) |
| Unit and component again after the test-only fixes (step-2 loop) | 22 | 10 | 10 of 10 passed (22/22 each) |

Also run once on the final code: full vitest excluding integration 2233 passed; `auth sign-up root-route admin-mfa` e2e 17 passed; `tsc --noEmit` and `prettier --check .` clean; lint 0 errors, 2 old warnings in `dev-preview`.

Full integration run (`tests/integration`, 136 tests) on the final code: 133 passed, 3 failed, none in F0-20 files:
- `family-home-budget-strip` T-02 and T-03 (FAM-03): month-boundary date bug in that test, see DECISIONS.md "Other findings". Not F0-20.
- `shared-sign-up` AC-04: failed once under load, passed when its file was rerun.

Earlier, in a first full integration run under load, `mocks-import-boundary` and `shared-sign-up` each flaked once and then passed on rerun.
