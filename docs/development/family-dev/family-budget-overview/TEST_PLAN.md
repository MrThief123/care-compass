# Test Plan — FAM-10 Family — Budget overview and history

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

The screen (bucket cards, History table, empty state, 'View breakdown' link) was already built on
fixtures under FAM-UI-05 (PR #92), with its own component-level tests. `getBudgetSummary` was already
wired to Supabase under FAM-03. This feature's actual remaining scope is `getFundHistory`'s Supabase
wiring, so T-01/T-04's component-level coverage and T-02/T-03's fixture-shape coverage are cited from
that existing work; T-05/T-06 are the new tests this session adds for the Supabase gap.

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given seed data, when Budget renders, then three bucket cards NDIS, Fixed, Government appear with remaining $14,880, $2,750, $240. | ☑ (FAM-UI-05/FAM-03) | PASS — `family-budget-view.test.tsx`; Supabase wiring in `tests/integration/family-home-budget-strip.test.ts` |
| T-02 | AC-02 | component | Given seed fund entries, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'. | ☑ (FAM-UI-05) | PASS — `history-table.test.tsx` (mock data) |
| T-03 | AC-03 | component | Given no fund entries, when History renders, then the empty state is shown. | ☑ (FAM-UI-05) | PASS — `family-budget-view.test.tsx` (mock data) |
| T-04 | AC-04 | e2e/component | Given Home, when 'View breakdown' is clicked, then the Budget page opens. | ☑ (FAM-UI-05/FAM-03) | PASS — `budget-strip.test.tsx` link href; new e2e below |
| T-05 | AC-02, AC-03 | integration | `getFundHistory` against local Supabase: newest-first order, fund top-ups and costs (paid, pending, pending-then-paid) mapped to `FundEntry`, RLS matches `getBudgetSummary`'s, empty for a client with none. | ☑ | PASS — `tests/integration/family-budget-overview.test.ts`, 9/9 |
| T-06 | AC-04 | e2e | Given Home (mock data), when 'View breakdown' is clicked, then the URL and heading are the Budget page's. | ☑ | PASS — `tests/e2e/family-budget-overview.spec.ts` |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
