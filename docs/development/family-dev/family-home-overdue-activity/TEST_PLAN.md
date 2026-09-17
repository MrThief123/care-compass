# Test Plan — FAM-02 Family Home — Overdue card and Recent activity

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given 3 overdue occurrences, when the Overdue card renders, then the badge shows '3' and three rows each show an 'Overdue' pill with warning icon. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given no overdue occurrences, when the card renders, then 'All caught up' and 'There are no overdue tasks right now.' are shown. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given the seed data, when Recent activity is queried, then exactly 5 items are returned ordered Mon 30 Nov, Sun 29 Nov, Sun 29 Nov, Sat 28 Nov, Sat 28 Nov. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given FAM-14 is available, when 'View all' is clicked, then the user navigates to `/family/<clientId>/tasks`. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
