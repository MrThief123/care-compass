# Progress — UI-01 Calendar kit: week/day/month grids, event blocks, date picker

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D3
Branch: `feature/shared-calendar-kit`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18 (claimed)

## Blockers
- None

## Dependencies status
- F0-14 — MERGED TO DEV
- UI-00 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Pure helpers `src/lib/dates/`: `weekRange(date)` (Monday start), `monthGrid(date)` (6×7 with out-of-month days), `positionBlocks(occurrences, {startHour: 7, rowPx: 44})`.
- `DayTimeline` (hour gutter 07:00–18:00, blocks with #0C9BA9 left stripe, title, assignee, duration, status pill — Family Home 'Today').
- `WeekGrid` (MON–SUN headers with day number, today column highlighted, hour gutter, blocks showing time + title; `labelFormat` prop for carer 'Margaret — Morning m…' truncation).
- `MonthGrid` (cell states default/today/selected/has-events/out-of-month).
- `CalendarHeader` (range label '30 Nov – 6 Dec 2026', prev/next, D/W/M segmented control default W).
- `DatePickerGrid` ('November 2026' with chevrons, MON–SUN, dots for days with items, selected filled circle, out-of-month muted).
- Component tests for each state; axe checks.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/lib/dates/*`, `src/components/shared/calendar/*`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE UI-01, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
