# Test Plan — FAM-05 Family Calendar — Tasks panel and Log panel

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Physiotherapy on Mon 30 Nov is Planned, when Helen ticks it, then it shows struck through and the completion is recorded with actor Helen. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given the save fails, when Helen ticks a task, then the checkbox returns to unticked and an error message is shown. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given the selected date is Monday 30 November, when the Tasks panel renders, then its subtitle reads 'Monday 30 November' and lists that day's occurrences. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given seed data, when the Log panel renders, then it lists Morning medication (Done · Aisha R.), Evening medication (Done · Aisha R.) and Weekly weigh-in (Overdue). | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
