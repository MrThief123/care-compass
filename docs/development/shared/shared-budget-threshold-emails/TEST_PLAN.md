# Test Plan — INT-01 Automatic budget threshold emails

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given Government bucket crosses the top warning threshold, when the job runs, then one email per eligible recipient is sent with the client's name and percentage. | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given the email for that threshold was already sent this period, when the job runs again, then no email is sent. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given a previous organisation's admin, when the job runs after transfer, then they receive no email. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given a request to the job endpoint without the secret, when received, then it returns 401 and does nothing. | ☐ | NOT RUN |
| T-05 | AC-05 | integration | Given the email provider errors, when the job runs, then the threshold is not recorded as sent. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
