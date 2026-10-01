# Test Plan — F0-21 Auth security audit

## Approach
Tests first (TESTING.md §2), run red for the expected reason, then fix. Every new test is run 10 times in a row and the result recorded below. Integration and e2e run against local Supabase only, with freshly created users.

## Test levels used
- **integration** → `tests/integration/shared-auth-security-audit.test.ts` (direct data API calls at AAL1, AAL2, cross-tenant)
- **unit** → cookie options, form submit
- **e2e** → `tests/e2e/auth-hardening.spec.ts`

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration + pgTAP | AAL1 admin cannot read or write admin-scoped tables; AAL2 can. | ☑ (red: pgTAP 1–23; integration on an unmigrated stack) | PASS (`tests/integration/shared-auth-security-audit.test.ts`, `supabase/tests/auth_security_audit.test.sql`) |
| T-02 | AC-02 | unit + e2e | Cookie options set `Secure` and `SameSite`; `HttpOnly` where allowed. | ☑ | PASS (`src/lib/supabase/cookie-options.test.ts`, `tests/e2e/auth-hardening.spec.ts`) |
| T-03 | AC-03 | integration + pgTAP | Cross-tenant read, insert, update, delete fails on every client-scoped table. | ☑ (red: shift reassignment, `overlapping_shifts`, `createStaff`) | PASS |
| T-04 | AC-03 | e2e + integration + unit | Another tenant's `/family/[clientId]` and `/admin` routes are refused. | ☑ (red: static mock admin pages) | PASS (`auth-hardening.spec.ts`, `src/server/auth/queries.request-time.test.ts`) |
| T-05 | AC-04 | integration | Repeated wrong password, reset and TOTP attempts are throttled. | ☐ | NOT WRITTEN. No throttle exists to test; local limits measured by probe; decision FD-07 |
| T-06 | AC-05 | unit + e2e | Submitting before hydration leaves no credentials in the URL. | ☑ | PASS (`src/app/(auth)/auth-forms-post.test.tsx`; e2e with JavaScript off) |
| T-07 | AC-06 | manual | `AUDIT_REPORT.md` exists and covers all items. | ☑ | PASS |

## Regression scope
`npm run lint`, `npm run typecheck`, full vitest, `npm run test:integration` and the auth e2e specs (`auth`, `sign-up`, `root-route`, `admin-mfa`) against local Supabase on a port other than 3000.

## Test data
Fresh users and organisations created through the service-role client and deleted afterwards.

## Flakiness record (10 consecutive runs)
- pgTAP `auth_security_audit.test.sql`: 10/10 clean.
- Unit (`cookie-options`, `auth-forms-post`, `queries.request-time`): 10/10 clean (13 tests per run).
- E2E `auth-hardening.spec.ts --repeat-each=10`: 50/50.
- Integration `shared-auth-security-audit.test.ts`: the first 10 runs were 7/10 clean. I couldn't
  reproduce the failures in 27 further runs, and GoTrue logged no errors during them. The likely
  cause was the before/after snapshot comparing rows in query order; it now compares them as a set.
  After that fix: 10/10 clean.
