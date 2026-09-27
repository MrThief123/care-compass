# Progress — FAM-14 Family — Task log

Status: IN PROGRESS
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D11
Branch: `feature/family-task-log`
PR target: `family-dev`
Last updated: 2026-09-27

## Blockers
- None — OQ-29 is ANSWERED (root DECISIONS.md).

## Dependencies status
- F0-11 — MERGED TO DEV
- FAM-UI-07 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/tasks`; title 'Task log'; no rail item, Home/Calendar rail stays unselected (PROPOSED: Home active).
- Search field 'Search tasks' (server query by title, debounced) with loading and no-results states.
- Status select 'All statuses' / Planned / Done / Overdue.
- Table: DATE ('Mon 30 Nov'), TASK, NURSE ('Aisha R.' or '—'), STATUS pill, chevron; rows clickable to FAM-15.
- Range: occurrences up to end of today, newest first (PROPOSED per design, OQ-31).
- Pagination/incremental loading (PROPOSED 25 rows + load more).
- Wire 'View all' on Home Recent activity and Calendar Log.

## Acceptance criteria status
- 0 / 5 MET

## Tests
- Written: 0 / 5
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/tasks/page.tsx`, `src/features/task-log/*`, `src/server/events/queries.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-29; then complete dependencies, run START FEATURE FAM-14, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
