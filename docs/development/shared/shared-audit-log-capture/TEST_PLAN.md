# Test Plan — F0-08 Append-only audit log capture

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Given Helen updates Margaret's client row, when the update commits, then one audit_log row exists with action UPDATE, actor_id = Helen, and before/after values. | ☐ | NOT RUN |
| T-02 | AC-02 | db | Given any authenticated user, when they attempt UPDATE or DELETE on audit_log, then the statement is rejected. | ☐ | NOT RUN |
| T-03 | AC-03 | db | Given a change executed with the service role, when it commits, then the audit row has actor_role 'system'. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
