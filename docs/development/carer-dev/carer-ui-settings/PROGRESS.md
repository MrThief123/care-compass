# Progress — CAR-UI-04 Carer Settings screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D6
Branch: `feature/carer-ui-settings`
PR target: `carer-dev`
Last updated: 2026-09-26 (claimed)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — MERGED
- UI-02 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/carer/settings` inside the carer layout.
- 'My info' `DetailsFormCard`: Name, Phone, Email, Role (read-only PROPOSED).
- Reset `SettingsActionCard`.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 2 MET

## Tests
- Written: 0 / 2
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/settings/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE CAR-UI-04, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
