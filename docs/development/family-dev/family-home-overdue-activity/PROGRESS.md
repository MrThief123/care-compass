# Progress — FAM-02 Family Home — Overdue card and Recent activity

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D8
Branch: `feature/family-home-overdue-activity` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-11 — NOT STARTED
- FAM-UI-01 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Overdue card (alert tone): warning icon + 'Overdue' title, alert count badge with total, rows with title, date ('Fri 27 Nov'), Overdue pill, chevron.
- Recent activity card: title, 'View all' link, 5 most recent items (title, date, status pill, chevron).
- When no overdue items: EmptyState 'All caught up / There are no overdue tasks right now.' inside the card (from States sheet).
- Chevrons and 'View all' render as links to routes owned by FAM-15 and FAM-14; until those merge, links are omitted (controls absent, not dead links).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/family-home/overdue-card.tsx`, `src/features/family-home/recent-activity-card.tsx`, `src/server/events/queries.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE FAM-02, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
