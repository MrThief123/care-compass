# Progress — CAR-05 Carer — Calendar (shifts) and selected-shift tasks

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D9–D10
Branch: `feature/carer-calendar-shifts` (not yet created)
PR target: `carer-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-33 — Carer calendar and task semantics

## Dependencies status
- F0-10 — NOT STARTED
- F0-11 — NOT STARTED
- CAR-UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/carer/calendar`; title 'Calendar', section 'Shifts', D/W/M default W; reuse calendar components from FAM-04.
- Blocks show time and '<Client> — <title>' truncated with ellipsis.
- Selecting a block shows 'Tasks for the selected shift' with subtitle '09:00 · Margaret — Morning medication' and a checklist (content per OQ-33).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/calendar/page.tsx`, `src/features/carer-calendar/*`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-33; then complete dependencies, run START FEATURE CAR-05, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
