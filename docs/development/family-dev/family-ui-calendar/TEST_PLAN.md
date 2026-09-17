# Test Plan — FAM-UI-02 Family Calendar screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given no view param, when the calendar renders, then W is selected and '30 Nov – 6 Dec 2026' is shown. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given fixtures, when the week renders, then Physiotherapy blocks appear at 11:30 on MON 30 and FRI 4. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given a user selects TUE 1, when the Tasks panel updates, then its subtitle reads 'Tuesday 1 December'. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given Physiotherapy unticked, when ticked, then its label is struck through (local state). | ☐ | NOT RUN |
| T-05 | AC-05 | e2e | Given the week view, when M is pressed, then a December 2026 month grid is shown. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
