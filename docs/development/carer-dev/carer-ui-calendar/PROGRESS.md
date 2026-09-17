# Progress — CAR-UI-03 Carer Calendar screen (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D5–D6
Branch: `feature/carer-ui-calendar` (not yet created)
PR target: `carer-dev`
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
- Route `/carer/calendar` inside the carer layout.
- Title 'Calendar', section 'Shifts', D/W/M.
- `WeekGrid` with carer label format '<Client> — <title>' truncated.
- 'Tasks for the selected shift' with subtitle and `TaskChecklist` (fixture sub-steps per design; semantics pending OQ-33).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/calendar/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE CAR-UI-03, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
