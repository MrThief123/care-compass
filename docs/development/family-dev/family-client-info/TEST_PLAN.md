# Test Plan — FAM-09 Family — Client info

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Margaret's Habits section, when Helen clicks Edit, changes the text and saves, then the new text is displayed. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given seed data, when Info renders, then Description, Habits, Medical history and Documentation cards appear in that order. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given the edit textarea exceeds the maximum length, when saved, then an error is shown and the text is not saved. | ☐ | NOT RUN |
| T-04 | AC-04 | db | Given Priya (admin), when she updates client_info_sections for Margaret, then the update is rejected. | ☐ | NOT RUN |
| T-05 | AC-05 | e2e | Given the Documentation card, when Helen adds 'Care plan.pdf', then a tile with that name appears. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
