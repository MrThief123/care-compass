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
| T-17 | AC-08 | component | Panel closed on load; a name opens it with details and Clients; Add Staff opens it empty; Close clears; empty staff list; switching rows discards the draft (`staff-screen.test.tsx`, `carer-assignments.test.tsx`). | ☐ (added after implementation, FD-05) | PASSING |
| T-18 | AC-08 | e2e | Real data: closed until a name or Add Staff; Aisha's panel shows her client; Close clears; Add Staff opens empty (`tests/e2e/admin-staff-panel.spec.ts`). | ☐ | PASSING (local stack) |
| T-19 | AC-09 | db | `admin_pending_staff_ids` returns only the caller's organisation's unconfirmed carers; carer and anon refused (`supabase/tests/admin_pending_staff.test.sql`, 6 tests). | ☐ | PASSING |
| T-20 | AC-09 | component | Invited carer labelled Pending in list and panel; a carer just added is Pending at once (`staff-screen.test.tsx`). | ☐ | PASSING |
| T-21 | AC-09, AC-10 | e2e | Real data: Priya invites Helen; Pending, still Pending after reload, unconfirmed in the database, absent from Manage; after confirmation listed on Manage with Margaret selectable and no longer Pending (`admin-staff-panel.spec.ts`). | ☐ | PASSING (local stack) |
| T-22 | AC-10 | unit | `assignShift` refuses a pending carer and creates nothing; creates nothing if the pending lookup fails (`manage-actions.test.ts`). | ☐ | PASSING |
| T-23 | AC-11 | component | Focus moves into the panel on open and back to the opening button on Close and on Escape (`staff-screen.test.tsx`). | ☐ | PASSING |
| T-24 | AC-08, AC-09 | manual | Real browser at 1920, 1024, 768 and 500: panel open/close, Pending label after reload, no overflow, no console errors (mock-mode build). | — | DONE |

## Regression scope
- Run the full unit/component suite, `supabase test db` and `npm run typecheck`/`lint` before marking READY FOR PR.
- Existing Staff screen tests pass, except the two ADM-02 expectations FD-05 changed (HUMAN REVIEW); `assignments` and `pendingIds` are optional props/fields.
- Run Playwright e2e for this dashboard (`--grep-invert "F0-07"`, local stack only) before opening the PR.

## Test data
- DB, integration and e2e tests create their own organisations, people and shifts. Mock mode: `staff-aisha` has Margaret Doyle and Elsie Marsh; another carer has one client (the implementation seeds the mock store).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
