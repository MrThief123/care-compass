# Test Plan — ADM-08 Admin — Manage carer-client assignments

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/admin_carer_assignments.test.sql` (pgTAP via `supabase test db`)
- **unit** → `src/server/admin/assignments-actions.test.ts` (mock data source)
- **component** → `src/features/admin-staff/carer-assignments.test.tsx` (through `StaffScreen`)
- **integration** → `tests/integration/admin-carer-assignments.test.ts` (local Supabase, real RLS and sessions)
- **e2e** → `tests/e2e/admin-carer-assignments.spec.ts` (local Supabase only)

## Contract the tests are written against
- DB: `admin_end_carer_assignment(p_carer_id uuid, p_client_id uuid) returns integer`: SECURITY DEFINER; caller must be an AAL2 admin of the client's organisation and of the carer's; refuses with `42501`, null client `22023`; cancels the pair's future shifts, sets `ends_at = now()` on the in-progress one; returns the number of shifts changed.
- Server: `src/server/admin/assignments-queries.ts` `getCarerAssignments(): { assignments: CarerAssignment[] }` with `CarerAssignment = { carerId, clientId, clientName, shiftCount, nextShift: { date, start, end } }`; `src/server/admin/assignments-actions.ts` `removeCarerAssignment({ carerId, clientId })` returning `{ ok: true, data: { endedShifts } }` or `{ ok: false, error: { code: "VALIDATION" | "UNAUTHORISED" | "UNEXPECTED", message } }`.
- UI: `StaffScreen` takes an optional `assignments: CarerAssignment[]` prop; region "Clients for <full name>"; button "Remove <client> from <carer>"; dialog "Remove carer from client?" with "Yes, remove" / "Cancel".

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Given Aisha's assignment to Elsie is ended, when Aisha queries Elsie, then zero rows are returned. | ☑ | PASSING |
| T-02 | AC-02 | db | Pair's future shifts cancelled, in-progress ended, count returned; finished, already-cancelled and other pairs unchanged; Aisha loses Margaret, keeps Nell; Daniel keeps Margaret; repeat returns 0; null client refused. | ☑ | PASSING |
| T-03 | AC-03 | db | Carer, other carer, family, other-org admin, AAL1 admin, other-org carer and anon are all refused; nothing changed. | ☑ | PASSING |
| T-04 | AC-04 | unit | Mock list shows full client names, shift count and next shift. | ☑ | PASSING |
| T-05 | AC-02 | unit | Mock remove drops only that pair; repeat is ok with 0. | ☑ | PASSING |
| T-06 | AC-06 | unit | Empty carer or client id rejected, store unchanged. | ☑ | PASSING |
| T-07 | AC-04 | component | Selected carer's clients by full name with Remove; switches on Edit; empty state; no list when adding; works with no assignments prop. | ☑ | PASSING |
| T-08 | AC-05 | component | Confirmation names both; Cancel does nothing; Confirm calls the action, drops the row, shows status; last client leaves empty state. | ☑ | PASSING |
| T-09 | AC-06 | component | Action failure keeps the row and shows the server message. | ☑ | PASSING |
| T-10 | AC-07 | component | No axe violations with list and confirmation open. | ☑ | PASSING |
| T-11 | AC-04 | integration | List scoped to own organisation; cancelled and finished shifts don't count. | ☑ | PASSING |
| T-12 | AC-01 | integration | After removal Aisha reads zero Elsie rows under her own session; list no longer shows the pair. | ☑ | PASSING |
| T-13 | AC-02 | integration | Removal effects on the four shift states; other pairs still readable. | ☑ | PASSING |
| T-14 | AC-03 | integration | Other-org admin, other-org carer and the carer herself get UNAUTHORISED; nothing changes. | ☑ | PASSING |
| T-15 | AC-01, AC-05 | e2e | Admin removes Margaret from Aisha on /admin/staff; row gone, persisted after reload, shift cancelled not deleted. | ☑ | PASSING (local stack, webpack build) |
| T-16 | AC-07 | manual | Width sweep 1920 to 768: nothing overlaps; Remove buttons 44x44px (real browser, in the implementation session). | — | DONE: no overflow at 1920, 1024, 768, 500; Remove 85.6x44px |

## Regression scope
- Run the full unit/component suite, `supabase test db` and `npm run typecheck`/`lint` before marking READY FOR PR.
- Existing Staff screen tests (`staff-screen.test.tsx`, `staff-states.test.tsx`) must pass unchanged: `assignments` is optional.
- Run Playwright e2e for this dashboard (`--grep-invert "F0-07"`, local stack only) before opening the PR.

## Test data
- DB, integration and e2e tests create their own organisations, people and shifts. Mock mode: `staff-aisha` has Margaret Doyle and Elsie Marsh; another carer has one client (the implementation seeds the mock store).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
