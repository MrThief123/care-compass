# Test Plan — FAM-04 Family Calendar — day, week and month views

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given no view param, when the calendar renders on Mon 30 Nov 2026, then W is selected and columns MON 30 to SUN 6 are shown with 30 highlighted. | ☐ | NOT RUN |
| T-02 | AC-02 | unit | Given date 2 Dec 2026, when `weekRange` runs, then it returns Mon 30 Nov 2026 to Sun 6 Dec 2026. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given the week of 30 Nov with seed data, when rendered, then '09:30 Weekly weigh-in' appears in the THU 3 column. | ☐ | NOT RUN |
| T-04 | AC-04 | e2e | Given the week view, when M is selected, then a month grid for December 2026 is shown with out-of-month days styled muted. | ☐ | NOT RUN |
| T-05 | AC-05 | integration | Given a weekly event anchored 2026, when the week of 5 Jan 2060 is viewed, then its occurrence is displayed. | ☐ | NOT RUN |
| T-06 | AC-06 | component | Given `date=not-a-date`, when the page renders, then the current week is shown. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
