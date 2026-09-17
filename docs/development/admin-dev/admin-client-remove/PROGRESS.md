# Progress — ADM-05 Admin — Remove client

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: POST-SPRINT · planned —
Branch: `feature/admin-client-remove` (not yet created)
PR target: `admin-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-06 — Organisation change model
- OQ-07 — Client record creation and family linking
- OQ-19 — Figma access and remaining design gaps

## Dependencies status
- ADM-04 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Remove action with confirmation (design required).
- PROPOSED: set clients.organisation_id null, end assignments, cancel future shifts — never delete data.

## Acceptance criteria status
- 0 / 2 MET

## Tests
- Written: 0 / 2
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/admin-clients/remove-client.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-06, OQ-07, OQ-19; then complete dependencies, run START FEATURE ADM-05, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
