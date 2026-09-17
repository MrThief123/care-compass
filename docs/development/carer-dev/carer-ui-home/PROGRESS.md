# Progress — CAR-UI-01 Carer Home screen (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D4
Branch: `feature/carer-ui-home` (not yet created)
PR target: `carer-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — NOT STARTED
- UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/carer/home` inside the carer layout.
- 'Today's calendar' card: rows '09:00 · Margaret — Morning medication · pill'.
- 'Tasks' card: `TaskChecklist` (local toggle).
- 'Notifications' card: `NotificationRow`s (Admin/Family).
- Header 'Home' with bell.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/home/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE CAR-UI-01, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
