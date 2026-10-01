# Test Plan — INT-01 Automatic budget threshold emails

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given Government bucket crosses the top warning threshold, when the job runs, then one email per eligible recipient is sent with the client's name and percentage. | ☐* | PASS |
| T-02 | AC-02 | integration | Given the email for that threshold was already sent this period, when the job runs again, then no email is sent. | ☐* | PASS |
| T-03 | AC-03 | integration | Given a previous organisation's admin, when the job runs after transfer, then they receive no email. | ☐* | PASS |
| T-04 | AC-04 | integration | Given a request to the job endpoint without the secret, when received, then it returns 401 and does nothing. | ☐* | PASS |
| T-05 | AC-05 | integration | Given the email provider errors, when the job runs, then the threshold is not recorded as sent. | ☐* | PASS |

\* Not written strictly first: `supabase/migrations/20261001080936_budget_threshold_notifications.sql` and `supabase/tests/budget_threshold_notifications.test.sql` (pgTAP, schema-level) were written together, run and fixed first; the job (`src/server/jobs/budget-thresholds.ts`), the email provider (`src/server/email/provider.ts`) and the route handler were then implemented, and T-01–T-05 (`tests/integration/budget-thresholds.test.ts`) were written against that and run. Flagged per CLAUDE.md §5/§10 (same as FAM-08's TEST_PLAN.md note) rather than left unstated. All run green on the first or second attempt (two fixture bugs in the pgTAP file itself — a missing NOT NULL column and a numeric/integer type mismatch — were caught and fixed by running it, not by review).
Extra coverage beyond the 5 ACs: `src/server/email/provider.test.ts` (5 unit tests for `ResendEmailProvider`'s request shape and failure handling) and 16 pgTAP cases in `supabase/tests/budget_threshold_notifications.test.sql` (table shape, RLS deny-all, the unique constraint, and `budget_thresholds_snapshot()`'s math against known fund/cost figures).

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
