# Progress — CAR-03 Carer — Patients

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D8
Branch: `feature/carer-patients` (not yet created)
PR target: `carer-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-09 — Carer access model

## Dependencies status
- F0-18 — NOT STARTED (added by CHG-027)
- F0-06 — NOT STARTED
- F0-10 — NOT STARTED
- CAR-UI-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/carer/patients`; search field 'Search patients' (server-side, D32).
- Person cards grid (4 columns at 1440): avatar initial, name, '78 years · Preston VIC'.
- Card click → `/carer/patients/[clientId]` (CAR-04).
- Empty state 'No patients assigned yet / New patients will appear here once they're assigned to you.'; card-grid skeleton; error state.

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/patients/page.tsx`, `src/components/shared/person-card.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-09; then complete dependencies, run START FEATURE CAR-03, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
