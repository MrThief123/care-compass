# Test Plan — F0-10 Shifts schema, active-shift function and conflict query

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Given Aisha has a shift for Margaret from 07:00 to 11:00 today, when `carer_on_active_shift(Margaret)` runs as Aisha at 09:00, then it returns true. | ☐ | NOT RUN |
| T-02 | AC-02 | db | Given the same shift, when the function runs at 11:00 exactly, then it returns false. | ☐ | NOT RUN |
| T-03 | AC-03 | db | Given the shift is cancelled, when the function runs at 09:00, then it returns false. | ☐ | NOT RUN |
| T-04 | AC-04 | db | Given Aisha has a shift 11:30–13:00, when `overlapping_shifts` is called for 12:00–15:00, then that shift is returned. | ☐ | NOT RUN |
| T-05 | AC-05 | db | Given an overlap exists, when Priya inserts the overlapping shift, then the insert succeeds. | ☐ | NOT RUN |
| T-06 | AC-06 | db | Given Aisha is a carer, when she inserts a shift, then the insert is rejected by RLS. | ☐ | NOT RUN |
| T-07 | AC-07 | db | Given Helen is Margaret's family, when she selects shifts, then she sees Margaret's shifts only. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
