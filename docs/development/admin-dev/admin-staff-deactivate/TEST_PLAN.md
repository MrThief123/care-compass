# Test Plan — ADM-03 Admin — Deactivate staff

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/admin_staff_deactivate.test.sql` (pgTAP via `supabase test db`)
- **integration** → `tests/integration/admin-staff-deactivate.test.ts` (Vitest against local Supabase)
- **unit** → `src/server/admin/staff-deactivate-actions.test.ts` (mock data source)
- **component** → `src/features/admin-staff/staff-deactivate.test.tsx`

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | After deactivation the carer reads zero clients rows (and no shifts). | ☑ | FAILS (expected) |
| T-02 | AC-02 | integration | A carer's earlier completions still show their name in the family task log after deactivation. | ☑ | FAILS (expected) |
| T-03 | AC-03 | db | Profile kept inactive; future shifts (two clients) cancelled; in-progress shift ended now; past, already-cancelled and other carers' shifts unchanged; completions untouched. | ☑ | FAILS (expected) |
| T-04 | AC-04 | db | Refused (42501) for the carer, another carer, family, other-org admin, admin at AAL1, no session, an admin target, another org's carer; nothing changes. | ☑ | FAILS (expected) |
| T-05 | AC-05 | db | Second deactivation succeeds and changes no shift. | ☑ | FAILS (expected) |
| T-06 | AC-06 | integration | A carer signed in before deactivation: next profile read shows inactive; sign-in is refused afterwards. | ☑ | FAILS (expected) |
| T-07 | AC-07 | component | Deactivate button visibility, dialog content, Cancel, Confirm, success message, move to Inactive. | ☑ | FAILS (expected) |
| T-08 | AC-08 | component | Inactive section shown with tag, hidden when empty; active list excludes them. | ☑ | FAILS (expected) |
| T-09 | AC-09 | component + unit | Failure keeps the carer active and shows an alert; action validation, NOT_FOUND (mock), mock store marks inactive, getAdminStaff reflects it. | ☑ | FAILS (expected) |
| T-10 | AC-03, AC-07 | integration | deactivateStaff against local Supabase end to end for an admin session; refused for a carer session. | ☑ | FAILS (expected) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR (`--grep-invert "F0-07"`).
- Axe check with the dialog open (reuse the ADM-08 pattern); width sweep 1920 to 768 for the Inactive section and dialog.

## Test data
- pgTAP: its own fixtures in the ADM-08 style (Banksia Home Care, Priya admin, Aisha and Daniel carers, Margaret/Elsie/Nell, Wendy admin of another organisation).
- Integration: creates and removes its own users and organisations.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
