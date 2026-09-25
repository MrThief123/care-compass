# Test Plan — F0-08 Append-only audit log capture

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Given Helen updates Margaret's client row, when the update commits, then one audit_log row exists with action UPDATE, actor_id = Helen, and before/after values. | ☑ | PASS |
| T-02 | AC-02 | db | Given any authenticated user, when they attempt UPDATE or DELETE on audit_log, then the statement is rejected. | ☑ | PASS |
| T-03 | AC-03 | db | Given a change executed with the service role, when it commits, then the audit row has actor_role 'system'. | ☑ | PASS |
| T-04 | AC-01 (supplementary) | db | INSERT and DELETE are captured with correct before/after images; a composite-key table row gets a null record_id but keeps client_id. | ☑ | PASS |
| T-02b | AC-02 (supplementary) | db | The table owner cannot UPDATE or DELETE audit_log either (append-only guard trigger). | ☑ | PASS |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
