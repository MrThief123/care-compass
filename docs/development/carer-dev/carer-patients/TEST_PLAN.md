# Test Plan — CAR-03 Carer — Patients

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given Aisha is assigned to Margaret, Robert, Elsie, Frank, Doris, Harold and Jean, when Patients loads, then 7 cards are shown including 'Margaret' '78 years · Preston VIC'. | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given search 'Eld', when submitted, then only Elsie is shown. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given no assignments, when Patients renders, then 'No patients assigned yet' is shown. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given a client in the same organisation without assignment, when Patients loads, then that client is absent. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
