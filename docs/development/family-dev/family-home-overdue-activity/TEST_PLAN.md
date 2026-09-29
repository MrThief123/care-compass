# Test Plan — FAM-02 Family Home — Overdue card and Recent activity

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given 3 overdue occurrences, when the Overdue card renders, then the badge shows '3' and three rows each show an 'Overdue' pill with warning icon. | ☑ | PASS |
| T-02 | AC-02 | component | Given no overdue occurrences, when the card renders, then 'All caught up' and 'There are no overdue tasks right now.' are shown. | ☑ | PASS |
| T-03 | AC-03 | integration | Given seeded occurrences, when Recent activity (Task log `status: done`/`overdue`, combined via `selectRecentActivity`) is queried against local Supabase, then exactly 5 items are returned, newest first. | ☑ | PASS |
| T-04 | AC-04 | component | Given FAM-14 is available, when 'View all' is clicked, then the user navigates to `/family/<clientId>/tasks`. | ☑ | PASS |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.
- F0-16 is not merged yet, so `tests/integration/family-home-overdue-activity.test.ts` (T-03) creates its own org/client/family-user fixtures and one-off events, per this rule's own allowance. It asserts newest-first order and the 5-item cap rather than the specific November dates the PROPOSED description names, since there is no seed data to anchor those dates to yet.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
