# Test Plan — FAM-14 Family — Task log

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given seed data, when the task log is loaded with no filters, then the first rows are Mon 30 Nov Morning medication (Done · Aisha R.), Physiotherapy (Planned), Afternoon check-in (Planned). | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given status filter Overdue, when applied, then only Weekly weigh-in (Sun 29 Nov) and Medication review (Sat 28 Nov) are listed, each with nurse '—'. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given search 'Zoe', when results are empty, then 'No matches for "Zoe".' is displayed. | ☐ | NOT RUN |
| T-04 | AC-04 | e2e | Given a row, when clicked, then the Task detail for that occurrence opens. | ☐ | NOT RUN |
| T-05 | AC-05 | integration | Given weekly recurring events extending forever, when the log loads, then no occurrence after today is returned. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
