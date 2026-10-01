# Test Plan — INT-03 End-to-end: carer care delivery journey

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **e2e** → `tests/e2e/carer-care-delivery.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Aisha on shift completes Afternoon check-in, when Helen loads Home, then the block shows 'Done · Aisha R.'. (Asserted as 'Done · Aisha Rahman', PD-038 — FD-01.) Journey: sign in → Patients → Margaret's card → Calendar tab → tick → reload persists → one completion row by Aisha → Helen's Home Today row. | ☑ | PASS (local Supabase, 2026-10-01) |
| T-02 | AC-02 | e2e | Given Aisha's shift has ended, when she tries to tick a task, then it cannot be completed. Shift ended 5 min ago + a shift tomorrow (keeps read access, F0-18): card says View only, Calendar lists the task with no tick box and the View only note, `set_occurrence_done` via her own session returns 42501, no completion row, Helen's row not Done. | ☑ | PASS (local Supabase, 2026-10-01) |
| T-02b | AC-02 | e2e | Given Aisha opened Margaret's Calendar on shift and the shift then ends (stale page), when she ticks the task, the save is refused ('Not permitted to tick off this task.'), the box reverts, no completion row; after reload there is no tick box. | ☑ | PASS (local Supabase, 2026-10-01) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
