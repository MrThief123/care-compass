# Test Plan — F0-11 Care events, occurrence overrides and append-only completions

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given a weekly 09:00 'Morning medication' event for Margaret, when `getOccurrences` runs for 30 Nov–6 Dec 2026, then it returns the weekly occurrences in that range with status 'planned' for future ones. | ☑ | PASS |
| T-02 | AC-02 | unit | Given an occurrence whose due time has passed and has no done completion, when `deriveStatus` runs, then status is 'overdue'. | ☑ | PASS |
| T-03 | AC-03 | unit | Given an occurrence with a latest completion action 'done' by Aisha Rahman, when `deriveStatus` runs, then status is 'done' with actor label 'Aisha R.'. | ☑ | PASS |
| T-04 | AC-04 | db | Given Helen is Margaret's family, when she calls `set_occurrence_done` for an occurrence, then a completion row with actor_id Helen is inserted. | ☑ | PASS |
| T-05 | AC-05 | db | Given Aisha is assigned to Margaret but not on an active shift, when she calls `set_occurrence_done`, then it is rejected (per OQ-09 default). | ☑ | PASS |
| T-06 | AC-06 | db | Given any user, when they try to UPDATE or DELETE a completion row, then the statement is rejected. | ☑ | PASS |
| T-07 | AC-07 | db | Given Robert's family member, when they select Margaret's events, then zero rows are returned. | ☑ | PASS |
| T-08 | AC-08 | integration | Given an event is deactivated, when occurrences are requested for next month, then none are returned, and past completions still appear in history queries. | ☑ | PASS |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
