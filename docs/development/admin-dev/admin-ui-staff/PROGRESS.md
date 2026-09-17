# Progress — ADM-UI-03 Admin Staff screen (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: SPRINT · planned D5–D6
Branch: `feature/admin-ui-staff` (not yet created)
PR target: `admin-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — NOT STARTED
- UI-02 — NOT STARTED
- UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/admin/staff` inside the admin layout.
- Staff list `DataTable` NAME · ROLE · EDIT with '+ Add staff'.
- Add / edit staff `SidePanelForm`: Name, Phone, Email, Role select; Save (local only). Edit prefills.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(admin)/admin/staff/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE ADM-UI-03, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
