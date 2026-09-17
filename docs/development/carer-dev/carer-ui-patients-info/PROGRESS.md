# Progress — CAR-UI-02 Carer Patients and patient info screens (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D4–D5
Branch: `feature/carer-ui-patients-info` (not yet created)
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
- Route `/carer/patients` inside the carer layout.
- Search field 'Search patients' (client-side on fixtures).
- `PersonCard` grid, 4 columns.
- Patient info `/carer/patients/[clientId]` with `ClientInfoView` (canEdit from fixture flag `onShift`; no organisation or payment controls — D10). No carer patient-info frame exists; reuse the Family Info layout (PROPOSED).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/patients/page.tsx`, `src/app/(carer)/carer/patients/[clientId]/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE CAR-UI-02, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
