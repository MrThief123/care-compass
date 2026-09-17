# Test Plan — FAM-13 Family — Change organisation

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Given Margaret at Banksia with 3 future shifts and 1 active assignment, when Helen transfers her to a second organisation, then clients.organisation_id changes, future shifts are cancelled and the assignment is ended. | ☐ | NOT RUN |
| T-02 | AC-02 | db | Given the transfer completed, when Priya (Banksia admin) selects Margaret, then zero rows are returned. | ☐ | NOT RUN |
| T-03 | AC-03 | db | Given the transfer completed, when Margaret's events, budget entries, documents and completions are counted, then counts equal the pre-transfer counts. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given Change organisation is confirmed from the picker, when the modal opens, then it shows the destructive title 'Change organisation?' and the retained/cleared wording. | ☐ | NOT RUN |
| T-05 | AC-05 | component | Given the modal is open, when Cancel is pressed, then no transfer action is called. | ☐ | NOT RUN |
| T-06 | AC-06 | db | Given Aisha (carer), when she calls `transfer_client_organisation`, then it raises a permission error. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
