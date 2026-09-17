# Test Plan — ADM-01 Admin Home — counts and overdue events

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given seed data, when Admin Home loads for Priya, then Clients shows the organisation's client count and Staff the active carer count. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given overdue items, when rendered, then a row shows 'Margaret', 'Wound dressing check', 'Aisha R.' and an Overdue pill. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given another organisation's overdue events, when Priya's home loads, then they are not included. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given no overdue events, when rendered, then 'All caught up' is shown. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
