# Test Plan — FAM-06 Family — Add event (Enter event)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Helen on Home, when she clicks 'Enter event', completes required fields with Recurring 'Weekly' and saves, then the event appears on the calendar every week from the chosen date. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given the Date field is empty, when Save event is pressed, then an error is shown on Date and nothing is submitted. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given the Pick a date panel for November 2026, when rendered with seed data, then days 24, 26, 27 show event dots and the selected day is filled. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given a carer or unrelated user calls the create-event action for Margaret, when executed, then it is rejected. | ☐ | NOT RUN |
| T-05 | AC-05 | component | Given Cancel is clicked, when the form has unsaved input, then no event is created. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
