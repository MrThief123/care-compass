# Test Plan — INT-02 End-to-end: organisation transfer journey

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Helen transfers Margaret to a second organisation, when Priya reloads Clients, then Margaret is absent, and when Aisha reloads Patients, Margaret is absent. | ☐ | NOT RUN |
| T-02 | AC-02 | e2e | Given the transfer, when Helen opens the Task log, then all previous completions still show. | ☐ | NOT RUN |
| T-03 | AC-03 | e2e | Given the second organisation's admin, when they open Clients, then Margaret is listed. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
