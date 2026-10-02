# Test Plan — ADM-09 Admin — Edit, extend or cancel a shift

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/admin_edit_shift.test.sql` (pgTAP via `supabase test db`)
- **unit** → `src/server/admin/shift-edit-actions.test.ts` (mock data source)
- **component** → `src/features/admin-manage/edit-shift.test.tsx`
- **integration** → `tests/integration/admin-edit-shift.test.ts` (Vitest against local Supabase)
- **e2e** → `tests/e2e/admin-edit-shift.spec.ts` (local Supabase only; skips otherwise)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | A 07:00–11:00 shift extended to 13:00 by the admin: `carer_on_active_shift` at 12:00 is true for Aisha, and false after 13:00. | ☑ | FAILS (expected) |
| T-02 | AC-02 | db | Admin (AAL2) changes start, end and carer to another active carer: row updated, one audit UPDATE with before/after and the admin as actor. Carer, family, other-org admin, admin at AAL1: no change. | ☑ | FAILS (expected) |
| T-03 | AC-03 | db | Admin cancels: `cancelled_at` set, row kept, not active for the carer, audit row. | ☑ | FAILS (expected) |
| T-04 | AC-04 | db | Ended shift, cancelled shift: update and cancel change nothing; end moved to the past refused; `cancelled_at` cannot be cleared. | ☑ | FAILS (expected) |
| T-05 | AC-05 | db | Reassign to a deactivated carer, an other-org carer: refused; client change refused; shift unchanged. | ☑ | FAILS (expected) |
| T-06 | AC-06 | unit | Validation, NOT_FOUND and success shapes of `updateShift` / `cancelShift` in mock mode. | ☑ | FAILS (expected) |
| T-07 | AC-07 | integration | `updateShift` / `cancelShift` end to end for an admin session; Melbourne conversion; ended shift NOT_FOUND; other-org admin refused; overlap not blocked; `getAdminManage` reflects each. | ☑ | FAILS (expected) |
| T-08 | AC-08 | component | Buttons only when editable; pre-filled Edit panel; Save payload; list/dots update; overlap warning excludes itself; time validation; failure keeps old times. | ☑ | FAILS (expected) |
| T-09 | AC-09 | component | Cancel dialog content; Keep shift; Cancel shift removes row and dot; failure alert; axe with dialog open. | ☑ | FAILS (expected) |
| T-10 | AC-01, AC-03 | e2e | In the browser: extend a shift to 13:00 and see it, cancel another; both persisted in the database and after reload. | ☑ | SKIPS without local stack |

## Regression scope
- Run the full unit/component suite, `supabase test db` (migration touches `shifts` policies) and `npm run test:integration` before marking READY FOR PR.
- Existing ADM-07, ADM-03 (`shifts_refuse_inactive_carer`), F0-10 `shifts.test.sql`, transfer and carer-shift tests must pass unchanged.
- Playwright for this dashboard (`--grep-invert "F0-07"`). Width sweep 1920 to 768 with the edit panel and dialog open.

## Test data
- pgTAP and integration: their own fixtures (Banksia Home Care, Priya admin, Aisha and Daniel carers, a deactivated carer, Margaret, another organisation with its admin, carer and client, a family member). Shift times relative to `now()` so "ended", "in progress" and "future" are stable.
- Component and unit: the Manage fixtures, with `editable` set per shift.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
