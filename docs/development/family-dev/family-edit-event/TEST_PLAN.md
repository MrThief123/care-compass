# Test Plan — FAM-07 Family — Edit event

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Physiotherapy weekly with description text, when Helen changes the description and saves, then the new description shows on Task detail. | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given an event with past completions, when its recurrence changes from weekly to fortnightly, then past completions are unchanged in the task log. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given the edit form, when Date is cleared and saved, then a Date error is shown. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given Robert's family member, when they open Margaret's event edit URL, then they are redirected without data. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
