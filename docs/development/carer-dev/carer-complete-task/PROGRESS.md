# Progress — CAR-06 Carer — Mark tasks done

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D10
Branch: `feature/carer-complete-task` (not yet created)
PR target: `carer-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-09 — Carer access model
- OQ-10 — Status behaviour and undo
- OQ-33 — Carer calendar and task semantics

## Dependencies status
- F0-10 — NOT STARTED
- F0-11 — NOT STARTED
- CAR-UI-01 — NOT STARTED
- CAR-UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Checkboxes on Home Tasks card and Calendar task panel call `set_occurrence_done`.
- Checkboxes rendered interactive only during an active shift for that client; otherwise read-only state display.
- Optimistic update with revert on failure.

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/carer-home/tasks-card.tsx`, `src/features/carer-calendar/shift-tasks-panel.tsx`, `src/server/events/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-09, OQ-10, OQ-33; then complete dependencies, run START FEATURE CAR-06, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
