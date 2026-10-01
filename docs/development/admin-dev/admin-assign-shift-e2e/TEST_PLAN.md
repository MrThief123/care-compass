# Test Plan — INT-04 End-to-end: admin rostering journey

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Priya assigns Aisha to Margaret on Tue 1 Dec 09:00–11:00, when Aisha opens Home, then a notification 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' is listed. | ☑ (verification of merged code, FD-01) | PASS (local Supabase) |
| T-02 | AC-02 | e2e | Given that shift, when Aisha opens Calendar week of 30 Nov, then a Tuesday block for Margaret is shown. | ☑ (FD-01) | PASS (local Supabase) |
| T-03 | PRD Users (Family), REQ-26 | e2e | Given that shift, when Helen opens Margaret's 09:30 task on Tue 1 Dec from Family · Calendar, then it reads 'Assigned to Aisha Rahman'. (FD-03) | ☑ | PASS (local Supabase) |
| T-04 | PRD Error / Edge Cases | e2e | Given Aisha's 09:00–11:00 shift, when Priya chooses 10:00–12:00 the same day, then the warning names 09:00 - 11:00, Assign shift stays enabled, the second shift is saved and Aisha gets a second 'New shift assigned' notification. (FD-03) | ☑ | PASS (local Supabase) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
