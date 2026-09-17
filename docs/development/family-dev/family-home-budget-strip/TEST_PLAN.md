# Test Plan — FAM-03 Family Home — Budget strip

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given seed budgets, when the strip renders, then the aggregate line reads '$17,870 remaining of $32,000 · 44% used'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given Government at 92% used, when its card renders, then it uses the alert tone, shows a warning icon and '$240' 'of $3,000 · 92% used'. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given NDIS at 38%, when its card renders, then it uses the normal tone and shows '$14,880' 'of $24,000 · 38% used'. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given no buckets exist, when the strip renders, then the no-funding empty state is shown. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
