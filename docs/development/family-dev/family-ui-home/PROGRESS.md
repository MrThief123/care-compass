# Progress — FAM-UI-01 Family Home screen (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D4
Branch: `feature/family-ui-home` (not yet created)
PR target: `family-dev`
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
- Route `/family/[clientId]/home` inside the family layout.
- Today panel via `DayTimeline` with caption 'Mon 30 Nov · day view'.
- Right column (340px): 'Enter event' primary button linking to `/family/[clientId]/events/new`; `AlertListCard` Overdue; Recent activity card with 'View all' → `/family/[clientId]/tasks` and chevrons → task detail.
- Budget strip: 'Budget', aggregate line, 'View breakdown' → `/family/[clientId]/budget`, three `BudgetBucketCard`s.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/home/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE FAM-UI-01, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
