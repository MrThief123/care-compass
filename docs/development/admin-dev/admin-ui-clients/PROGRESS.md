# Progress — ADM-UI-04 Admin Clients screen (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: SPRINT · planned D6
Branch: `feature/admin-ui-clients` (not yet created)
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
- Route `/admin/clients` inside the admin layout.
- Client list `DataTable` NAME · FAMILY CONTACT · REMOVE with '+ Add client'; Remove links styled alert (no action — OQ-06/07).
- Add client `SidePanelForm`: Client name, Family contact name, Family contact email, Notes; 'Add client' (local only).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(admin)/admin/clients/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE ADM-UI-04, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
