# Test Plan — ADM-04 Admin — Clients list and add client

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Priya enters Client name 'Harold', Family contact 'Grace', email 'grace@example.com' and clicks Add client, then Harold appears in the list with family contact 'Grace'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given Client name is empty, when Add client is pressed, then an error is shown. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given seed data, when the list renders, then rows include 'Margaret' with family contact 'Helen'. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given Priya, when she calls the client-info update action, then it is rejected (D28). | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
