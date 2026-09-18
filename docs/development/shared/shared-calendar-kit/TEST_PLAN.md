# Test Plan — UI-01 Calendar kit: week/day/month grids, event blocks, date picker

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Given 2 Dec 2026, when `weekRange` runs, then it returns Mon 30 Nov – Sun 6 Dec 2026. | ☑ | PASS |
| T-02 | AC-02 | unit | Given events at 09:00 (60 min) and 11:30 (90 min), when `positionBlocks` runs from 07:00 with 44px rows, then tops are 88px and 198px and heights 44px and 66px. | ☑ | PASS |
| T-03 | AC-03 | component | Given the fixture week of 30 Nov, when `WeekGrid` renders, then MON 30 is highlighted and '09:30 Weekly weigh-in' appears under THU 3. | ☑ | PASS |
| T-04 | AC-04 | component | Given `DatePickerGrid` for November 2026 with items on 24, 26, 27 and selected 30, when rendered, then those days show dots and 30 is filled. | ☑ | PASS |
| T-05 | AC-05 | component | Given `CalendarHeader` without a view prop, when rendered, then W is selected and the label reads '30 Nov – 6 Dec 2026'. | ☑ | PASS |
| T-06 | AC-06 | component | Given each calendar component, when checked with axe, then there are no violations. | ☑ | PASS |

Additional tests beyond the mapped set (`monthGrid` unit tests, `DayTimeline` state/positioning tests, `WeekGrid` `labelFormat` override, `MonthGrid`/`DatePickerGrid` selection callbacks) also pass — see `src/lib/dates/*.test.ts` and `src/components/shared/calendar/*.test.tsx`.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
