# Progress — ADM-07 Admin — Assign shift

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: SPRINT · planned D10
Branch: `feature/admin-assign-shift` (not yet created)
PR target: `admin-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-09 — Carer access model

## Dependencies status
- F0-10 — NOT STARTED
- ADM-06 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Date: month grid (MON–SUN), prev/next, dots where the selected carer already has shifts, selected date filled.
- Time slot chips; 'Custom' reveals start/end time inputs (not drawn — PROPOSED two time inputs).
- Soft conflict inline alert: 'Aisha already has a shift with Margaret from 11:30–13:00 that overlaps this time. You can still assign it.' generated from `overlapping_shifts`.
- Cancel (clears date/slot) and 'Assign shift' (creates shift; success message PROPOSED).
- No Repeat control (D31).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/admin-manage/assign-shift-panel.tsx`, `src/components/shared/date-picker-grid.tsx`, `src/server/shifts/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-09; then complete dependencies, run START FEATURE ADM-07, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
