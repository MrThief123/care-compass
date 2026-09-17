# Test Plan — FAM-11 Family — Update funds

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given NDIS remaining $14,880, when $1,000 is added to NDIS, then the NDIS card shows $15,880 and History's first row shows '+$1,000'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given amount '-50', when submitted, then a validation error is shown and nothing is saved. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given a user without fund-edit rights (per OQ-05), when they call the action, then it is rejected. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
