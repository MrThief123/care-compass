# Test Plan — CAR-01 Carer Home — Today's calendar and Tasks

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given seed data for Aisha on 30 Nov, when Home renders, then Today's calendar shows '09:00 Margaret — Morning medication' with 'Done · Aisha R.', '11:30 Margaret — Physiotherapy' Planned and '15:00 Margaret — Afternoon check-in' Planned. | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given Aisha is not assigned to Robert, when her today query runs, then no Robert occurrences are returned. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given no occurrences, when Home renders, then the empty state is shown. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
