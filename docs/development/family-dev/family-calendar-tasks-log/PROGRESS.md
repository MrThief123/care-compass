# Progress — FAM-05 Family Calendar — Tasks panel and Log panel

Status: IN PROGRESS
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D9
Branch: `feature/family-calendar-tasks-log`
PR target: `family-dev`
Last updated: 2026-09-27

## Blockers
- None — OQ-10 is ANSWERED (root DECISIONS.md): Overdue derived when due time passes without Done; Done can be undone by the same actor or family via an append-only 'undone' entry.

## Dependencies status
- F0-11 — NOT STARTED
- FAM-UI-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Tasks panel: title 'Tasks', selected date subtitle ('Monday 30 November'), checkbox per occurrence; checked items struck through and muted.
- Ticking calls `set_occurrence_done` and optimistically updates, reverting with an inline error on failure.
- Unticking behaviour per OQ-10 (not implemented until answered).
- Log panel: title 'Log', 'View all' link (to FAM-14), last 3 items (PROPOSED count from design) with status pills and chevrons (to FAM-15 once merged).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/family-calendar/tasks-panel.tsx`, `src/features/family-calendar/log-panel.tsx`, `src/server/events/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-10; then complete dependencies, run START FEATURE FAM-05, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
