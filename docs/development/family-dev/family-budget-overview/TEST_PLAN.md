# Test Plan — FAM-10 Family — Budget overview and history

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given seed data, when Budget renders, then three bucket cards NDIS, Fixed, Government appear with remaining $14,880, $2,750, $240. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given seed fund entries, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given no fund entries, when History renders, then the empty state is shown. | ☐ | NOT RUN |
| T-04 | AC-04 | e2e | Given Home, when 'View breakdown' is clicked, then the Budget page opens. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
