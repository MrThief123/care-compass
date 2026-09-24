# Test Plan — F0-17 Self-serve sign-up for Family and Organisation accounts

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **e2e** → `tests/e2e/sign-up.spec.ts` (Playwright)
- **integration** → `tests/integration/shared-sign-up.test.ts` (Vitest against local Supabase)
- **db** → `supabase/tests/` pgTAP

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Family sign-up with client 'Harold Smith' lands on `/family/<Harold id>/home`; Harold has null `organisation_id`; a `client_family_members` row links the new profile. | ☐ | — |
| T-02 | AC-02 | integration | Organisation sign-up creates 'Wattle Care' and an `admin` profile with that `organisation_id`; `redirectTo` equals what `signIn` returns for that admin (MFA gate path). | ☐ | — |
| T-03 | AC-03 | integration | Missing field, mismatched passwords and short password each return a field error; no auth user or table rows are created. | ☐ | — |
| T-04 | AC-04 | integration | Sign-up with an existing email returns the 'already exists' error; row counts in `profiles`, `clients`, `organisations` are unchanged. | ☐ | — |
| T-05 | AC-05 | db | The registration function called with role `carer` raises; no `profiles` row exists for the caller. | ☐ | — |
| T-06 | AC-06 | integration | A crafted sign-up carrying Banksia's organisation id and Margaret's client id creates an account linked to neither; the new session reads zero Banksia/Margaret rows. | ☐ | — |
| T-07 | AC-07 | db | As a signed-up family user and as a signed-up admin, updating own `role`, `organisation_id` or `is_active` is rejected; rows unchanged. Calling the registration function a second time is rejected. | ☐ | — |
| T-08 | AC-08 | e2e | `/sign-up` renders in the auth layout with the shared components; conditional fields switch with account type; no carer option; carer help text; the links between the sign-in and sign-up pages work. | ☐ | — |

## Regression scope
- Re-run F0-07's tests (`tests/integration/shared-authentication.test.ts`, `tests/e2e/auth.spec.ts`). `/sign-in` gains a link, and nothing else in it may change.
- Full unit/component suite and `supabase test db` before READY FOR PR.

## Test data
- F0-16 seed data where it exists (Banksia Home Care, Margaret, Helen). Otherwise ad hoc users via the service-role client, as F0-07 did. Use `@example.test` addresses only (synthetic data, CLAUDE.md §12).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
