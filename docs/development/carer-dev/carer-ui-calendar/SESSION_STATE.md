# Session State — CAR-UI-03 Carer Calendar screen (UI)

Last session date: 2026-09-26
Current branch: `feature/carer-ui-calendar` (from `carer-dev`)
Worked on: claim, docs for CHG-025/CHG-030, tests first
What changed: CHG-030 in root DECISIONS.md; feature PRD/ACs/TEST_PLAN/DECISIONS rewritten; tests in `src/server/shifts/queries.test.ts` and `src/features/carer-calendar/carer-calendar.test.tsx`
Tests run: `npx vitest run src/features/carer-calendar src/server/shifts`
Test results: 27 new tests red for the expected reason; 6 existing CAR-UI-01 contract tests pass
Current blocker: None
Important discoveries: Family's `CalendarToolbar` always renders 'Enter event', so carer needs a local toolbar (FD-02). Family `calendar-params` has everything the URL needs except a carer href: use `calendarQuery` and prefix `/carer/calendar?`. `WeekGrid`/`DayTimeline`/`MonthGrid` take `PlainEventOccurrence`; map shifts the same way as `carer-home-view.tsx` `toCalendarEvent`.
Important decisions: CHG-030 (contract, Family-style navigation, block opens the patient)
Exact next action: Implement `getCarerShifts` (validate range with `OccurrenceRangeSchema`, filter `SHIFTS` by carer and Melbourne day, sort, add `clientFirstName`), then `/carer/calendar` page + loading + `src/features/carer-calendar/*` until all tests pass.
Files likely to be touched next: `src/server/shifts/queries.ts`, `src/mocks/queries/shifts.ts`, `src/app/(carer)/carer/calendar/{page,loading}.tsx`, `src/features/carer-calendar/*`
Warning for next session: Do not edit `src/features/family-calendar/**` or `src/components/shared/**` (import only). Flag the `src/server`/`src/mocks` edits in the PR (CHG-030). Do not change the tests without a DECISIONS entry.
