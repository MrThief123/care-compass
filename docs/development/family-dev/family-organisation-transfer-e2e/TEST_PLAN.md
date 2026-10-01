# Test Plan — INT-02 End-to-end: organisation transfer journey

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Helen transfers Margaret to a second organisation, when Priya reloads Clients, then Margaret is absent, and when Aisha reloads Patients, Margaret is absent. | ☑ | PASS |
| T-02 | AC-02 | e2e | Given the transfer, when Helen opens the Task log, then all previous completions still show. | ☑ | PASS |
| T-03 | AC-03 | e2e | Given the second organisation's admin, when they open Clients, then Margaret is listed. | ☑ | PASS |

All three are one Playwright test (`tests/e2e/organisation-transfer.spec.ts`) rather than three
separate ones: the ACs are three checkpoints along a single continuous journey (one transfer,
checked from four signed-in sessions), and splitting them would mean re-running the seed and the
transfer itself for each. Written against the real screens from the start (no separate "run red"
step meaningful here — there was no code to make pass, only the test itself, run and debugged
until green against the real app and a real local Supabase stack).

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
