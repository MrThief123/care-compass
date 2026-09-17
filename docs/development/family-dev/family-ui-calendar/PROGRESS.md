# Progress — FAM-UI-02 Family Calendar screen (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D4–D5
Branch: `feature/family-ui-calendar` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — NOT STARTED
- UI-01 — NOT STARTED
- UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/calendar` inside the family layout.
- `CalendarHeader` + `WeekGrid`/`DayTimeline`/`MonthGrid` switched by D/W/M (URL param).
- Tasks panel: 'Tasks', selected date subtitle, `TaskChecklist` (local toggle).
- Log panel: 'Log', 'View all', three `ActivityRow`s.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 5 MET

## Tests
- Written: 0 / 5
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/calendar/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE FAM-UI-02, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
