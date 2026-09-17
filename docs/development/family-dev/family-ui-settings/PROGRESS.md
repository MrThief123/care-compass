# Progress — FAM-UI-06 Family Settings screen (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-settings` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — NOT STARTED
- UI-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/settings` inside the family layout.
- 'Change organisation' `SettingsActionCard` ('Currently registered with Banksia Home Care.'); 'Change' opens the destructive `ConfirmationModal` with the D36 wording (organisation picker undesigned — OQ-06).
- Family info `DetailsFormCard`: Name, Phone, Email, Address.
- Reset `SettingsActionCard` with 'Reset'.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/settings/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE FAM-UI-06, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
