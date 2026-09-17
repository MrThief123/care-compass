# Progress — CAR-04 Carer — Client info

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D9
Branch: `feature/carer-client-info` (not yet created)
PR target: `carer-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-09 — Carer access model

## Dependencies status
- F0-06 — NOT STARTED
- F0-10 — NOT STARTED
- F0-13 — NOT STARTED
- CAR-UI-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/carer/patients/[clientId]` using `ClientInfoView` in carer mode.
- Header: 'Patients' screen name (PROPOSED) with in-page client summary.
- Edit links and Add file tile rendered only when `carer_on_active_shift(clientId)` is true.
- No organisation or payment controls (D10).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/patients/[clientId]/page.tsx`, `src/components/shared/client-info-view.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-09; then complete dependencies, run START FEATURE CAR-04, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
