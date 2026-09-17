# Test Plan — FAM-15 Family — Task detail

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given Morning medication on 30 Nov done by Aisha Rahman at 09:14, when Task detail renders, then it shows 'Done · Aisha R.' and 'Completed at 09:14'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given the task, when rendered, then the subline reads 'Monday 30 November 2026 · Assigned to Aisha R.'. | ☐ | NOT RUN |
| T-03 | AC-03 | e2e | Given the Overdue card on Home, when the chevron on 'Wound dressing check' is clicked, then its Task detail opens. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given an occurrence key for Robert's event under Margaret's route, when requested, then a not-found page is returned. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
