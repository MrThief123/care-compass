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
| T-01 | AC-01 | integration | AAL1 admin cannot read or write admin-scoped tables; AAL2 can. | ☐ | NOT RUN |
| T-02 | AC-02 | unit | Cookie options set `Secure` and `SameSite`; `HttpOnly` where allowed. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Cross-tenant read, insert, update, delete fails on every client-scoped table. | ☐ | NOT RUN |
| T-04 | AC-03 | e2e | Another tenant's `/family/[clientId]` and `/admin` routes are refused. | ☐ | NOT RUN |
| T-05 | AC-04 | integration | Repeated wrong password, reset and TOTP attempts are throttled. | ☐ | NOT RUN |
| T-06 | AC-05 | e2e | Submitting before hydration leaves no credentials in the URL. | ☐ | NOT RUN |
| T-07 | AC-06 | manual | `AUDIT_REPORT.md` exists and covers all items. | ☐ | NOT RUN |

## Regression scope
`npm run lint`, `npm run typecheck`, full vitest, `npm run test:integration` and the auth e2e specs (`auth`, `sign-up`, `root-route`, `admin-mfa`) against local Supabase on a port other than 3000.

## Test data
Fresh users and organisations created through the service-role client and deleted afterwards.

## Flakiness record (10 consecutive runs)
Filled in at the end.
