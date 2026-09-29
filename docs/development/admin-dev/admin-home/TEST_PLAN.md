# Test Plan — ADM-01 Admin Home — counts and overdue events

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given seed data, when Admin Home loads for Priya, then Clients shows the organisation's client count and Staff the active carer count (carers only, inactive excluded). | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given an overdue task, when `getAdminHome()` loads for Priya, then a row shows the client's full name, the task title, the covering carer's full name (PD-038) and it is marked overdue. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given another organisation's clients/counts/overdue events, when Priya's home loads, then none of them are included. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given no overdue events, when rendered, then 'All caught up' is shown. | ☐ | NOT RUN |
| T-05 | AC-05 | integration | Given upcoming shifts across the organisation (CHG-034), when `getAdminHome()` loads for Priya, then `upcomingShifts` lists them ordered by start time ascending with client/carer full names and formatted date/time, excluding another organisation's shifts, past shifts and cancelled shifts. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- F0-16 is not yet merged, so the integration test seeds its own fixtures (organisation, clients,
  carers, shifts, care events), following `tests/integration/family-home-budget-strip.test.ts`'s
  pattern. AC-04's empty-state check is a component test against `AdminHomeScreen` directly.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
