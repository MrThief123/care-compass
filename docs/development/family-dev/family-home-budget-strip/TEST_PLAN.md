# Test Plan — FAM-03 Family Home — Budget strip

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given seed budgets, when the strip renders, then the aggregate line reads '$17,870 remaining of $32,000 · 44% used'. | ☑ (FAM-UI-01) | PASS |
| T-02 | AC-02 | component + integration | Given Government at 92% used, when its card renders, then it uses the alert tone, shows a warning icon and '$240' 'of $3,000 · 92% used'. | ☑ | PASS |
| T-03 | AC-03 | component + integration | Given NDIS at 38%, when its card renders, then it uses the normal tone and shows '$14,880' 'of $24,000 · 38% used'. | ☑ | PASS |
| T-04 | AC-04 | component + integration | Given no buckets exist, when the strip renders, then the no-funding empty state is shown. | ☑ | PASS |

The component level (T-01–T-04) is FAM-UI-01's own tests against `BudgetStrip`/`BudgetBucketTile`,
unaffected by this feature. This feature's actual gap was `getBudgetSummary`'s Supabase branch,
which the component tests cannot reach (they pass `BudgetBucketSummary[]` as a prop, not through
the contract). T-02/T-03/T-04 are re-proven at integration level against local Supabase in
`tests/integration/family-home-budget-strip.test.ts`, which also adds RLS scope tests (assigned
carer, org admin, unassigned carer, unrelated family — none in TEST_PLAN's own list) and a test for
the pending-cost-forces-'exhausted' rule in `budget_bucket_summary`. See DECISIONS.md FD-02.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR. (Playwright always runs
  `DATA_SOURCE=mock`, so it cannot exercise the Supabase branch — the same structural limitation
  FAM-04/05/06/14 each recorded in their own DECISIONS.md; the integration tests are the real proof.)

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
