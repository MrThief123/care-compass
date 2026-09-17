# Test Plan — F0-07 Sign-in, sign-out, password reset and role-based routing

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Helen has an active family account linked to Margaret, when she signs in with correct credentials, then she lands on `/family/<Margaret id>/home`. | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given incorrect credentials, when sign-in is submitted, then a generic error is shown and no session cookie is set. | ☐ | NOT RUN |
| T-03 | AC-03 | e2e | Given Aisha (carer) signs in, when sign-in succeeds, then she lands on `/carer/home`. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given Aisha is signed in, when she requests `/admin/home`, then the server redirects her to `/carer/home`. | ☐ | NOT RUN |
| T-05 | AC-05 | integration | Given no session, when `/family/<id>/home` is requested, then the response redirects to `/sign-in`. | ☐ | NOT RUN |
| T-06 | AC-06 | integration | Given Aisha's profile is deactivated, when she makes her next request, then she is signed out and sees the withdrawn-access message. | ☐ | NOT RUN |
| T-07 | AC-07 | integration | Given a registered email, when a reset is requested, then Supabase sends a reset email and the page confirms 'We'll email you a secure link'. | ☐ | NOT RUN |
| T-08 | AC-08 | integration | Given an unregistered email, when a reset is requested, then the same confirmation is shown (no enumeration). | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
