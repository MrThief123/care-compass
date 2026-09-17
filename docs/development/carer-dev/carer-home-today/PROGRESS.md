# Progress — CAR-01 Carer Home — Today's calendar and Tasks

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D8
Branch: `feature/carer-home-today` (not yet created)
PR target: `carer-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-33 — Carer calendar and task semantics
- OQ-09 — Carer access model

## Dependencies status
- F0-10 — NOT STARTED
- F0-11 — NOT STARTED
- CAR-UI-01 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/carer/home`; header 'Home' with bell (bell behaviour CAR-02).
- 'Today's calendar' card: rows '09:00 · Margaret — Morning medication · status pill'.
- 'Tasks' card: checkbox list of the same occurrences (completion behaviour in CAR-06; here read-only checked state).
- Empty state 'Nothing scheduled today' (PROPOSED), skeleton and error states.

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/home/page.tsx`, `src/features/carer-home/*`, `src/server/events/carer-queries.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-33, OQ-09; then complete dependencies, run START FEATURE CAR-01, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
