# Test Plan — F0-12 Budget buckets, fund top-ups, spending and summary calculation

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Given NDIS total $24,000 and expenses $9,120, when the summary runs, then remaining is 14880.00 and percent_used is 38. | ☐ | NOT RUN |
| T-02 | AC-02 | db | Given Government total $3,000 and expenses $2,760, when the summary runs, then percent_used is 92 and threshold_state is 'alert' (under 70/90/100 thresholds; recalculated once OQ-03 is answered). | ☐ | NOT RUN |
| T-03 | AC-03 | db | Given expenses exceed the total, when the summary runs, then remaining is negative and threshold_state is 'depleted'. | ☐ | NOT RUN |
| T-04 | AC-04 | db | Given `record_expense` is called with amount 0 or -5, when executed, then it raises a validation error and nothing is inserted. | ☐ | NOT RUN |
| T-05 | AC-05 | db | Given a user not linked to Margaret, when they select Margaret's buckets, then zero rows are returned. | ☐ | NOT RUN |
| T-06 | AC-06 | unit | Given the decimal string '12.345', when parsed by the money schema, then validation fails (max 2 decimal places). | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
