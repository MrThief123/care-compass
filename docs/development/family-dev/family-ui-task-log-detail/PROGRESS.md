# Progress — FAM-UI-07 Family Task log and Task detail screens (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D6–D7
Branch: `feature/family-ui-task-log-detail` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — NOT STARTED
- UI-03 — NOT STARTED
- UI-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/tasks` inside the family layout.
- Task log: title, search field, 'Status' select (All statuses/Planned/Done/Overdue), `DataTable` DATE · TASK · NURSE · STATUS with chevrons.
- Task detail `/family/[clientId]/tasks/[occurrenceKey]`: 'Back to Task log', title, 'Monday 30 November 2026 · Assigned to Aisha R.', Status card with 'Completed at 09:14', Description card with Edit link to edit event, Documents card.
- Search and filter act on fixtures client-side (server search comes with wiring, D32).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/tasks/page.tsx`, `src/app/(family)/family/[clientId]/tasks/[occurrenceKey]/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE FAM-UI-07, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
