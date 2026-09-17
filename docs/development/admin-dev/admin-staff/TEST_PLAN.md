# Test Plan — ADM-02 Admin — Staff list and add/edit staff

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Priya completes Name, Phone, Email and Role 'Enrolled Nurse' and saves, then the new staff member appears in the list with role 'Enrolled Nurse'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given Email is empty, when Save is pressed, then an Email error is shown. | ☐ | NOT RUN |
| T-03 | AC-03 | e2e | Given Aisha's row, when Edit is clicked, then the panel shows her Name, Phone, Email and Role. | ☐ | NOT RUN |
| T-04 | AC-04 | db | Given Priya, when she updates a profile in another organisation, then RLS rejects it. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
