# Test Plan — CAR-02 Carer — Notifications card and bell

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Given Priya assigns Aisha a shift on Tue 1 Dec 09:00–11:00 for Margaret, when the insert commits, then a notification for Aisha with source 'admin' and message 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' exists. | ☐ | NOT RUN |
| T-02 | AC-02 | db | Given Helen uploads a client document for Margaret, when it commits, then each carer assigned to Margaret receives a 'family' notification. | ☐ | NOT RUN |
| T-03 | AC-03 | db | Given Daniel, when he selects notifications, then Aisha's notifications are not returned. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given three notifications, when the card renders, then each row shows its source chip and message newest first. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
