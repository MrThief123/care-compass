# Test Plan — ADM-02 Admin — Staff list and add/edit staff

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

Levels changed from the plan's original "e2e" for T-01/T-03: creating a real account (invite email,
`auth.admin`) and RLS-scoped edits are data/permission concerns, not UI-interaction concerns — a real
browser round trip would exercise the same code path as an integration test while costing much more to
run and maintain. Split each into a data-layer check (integration, against local Supabase) and a
component-layer check (the client form's prefill/validation, already meaningfully covered at component
level). Recorded in `admin-staff/DECISIONS.md` FD-01.

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given Priya invites a new carer with First/Last name, Phone, Email and Role 'Enrolled Nurse', then `getAdminStaff()` then includes them with that role, against local Supabase (real `auth.admin.inviteUserByEmail` + RPC). | ☑ | PASS — `tests/integration/admin-staff.test.ts` |
| T-01b | AC-01 | unit | The same create round trip in mock mode (`createStaff` → `getAdminStaff`), plus validation rejections (blank first name, empty email) touch no data. | ☑ | PASS — `src/server/admin/staff-actions.test.ts` |
| T-02 | AC-02 | component | Given Email is empty, when Save is pressed, then an Email error is shown and `createStaff` is never called. | ☑ | PASS — `staff-screen.test.tsx` |
| T-03 | AC-03 | integration | Given Aisha's real profile, when Priya edits it, then `updateStaff`'s result and a subsequent `getAdminStaff()` carry her full contact details. | ☑ | PASS — `admin-staff.test.ts` |
| T-03b | AC-03 | component | Given Aisha's row, when Edit is clicked, then the panel shows her First name, Last name, Phone, Email and Role (client-side prefill, `updateStaff` mocked). | ☑ | PASS — `staff-screen.test.tsx` |
| T-04 | AC-04 | db | Given Priya, when she updates a profile in another organisation, then RLS/the RPC's guard rejects it (42501). | ☑ | PASS — `supabase/tests/admin_staff.test.sql`, 25/25 |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- F0-16 is not yet merged, so every test seeds its own fixtures (organisations, admins, carers),
  following `tests/integration/family-home-budget-strip.test.ts`'s and `supabase/tests/sign_up.test.sql`'s
  patterns. Component tests use their own inline fixtures with `createStaff`/`updateStaff` mocked.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
