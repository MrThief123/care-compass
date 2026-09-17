# Test Plan — F0-16 Development seed data from the design content

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given `supabase db reset`, when the budget summary for Margaret is queried, then NDIS remaining 14880, Fixed 2750, Government 240 are returned. | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given the seed, when signing in as Helen, Aisha and Priya with seed credentials, then each succeeds and lands on their role home. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given NODE_ENV=production, when the seed script runs, then it exits non-zero without writing. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
