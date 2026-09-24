# Progress — FAM-UI-05 Family Budget screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-budget` (created from `origin/family-dev` at 02c7fa7)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None recorded at claim time. Anything outside Lane F (a History contract read and design fixtures) will be raised as a stop-and-ask before it is touched (CLAUDE.md §10).

## Dependencies status
- F0-15 — MERGED
- UI-03 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed (`docs(family-ui-budget): claim`)

## In progress
- Feature docs and tests-first (no production code yet)

## Remaining
- Route `/family/[clientId]/budget` inside the family layout.
- 'Funds by source' card with 'Update' primary button (no action — flow undesigned, OQ-05).
- Three `BudgetBucketCard`s.
- History `DataTable`: DATE · DESCRIPTION · AMOUNT.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/budget/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Write the tests in TEST_PLAN.md first, run them red, then wait for the human's go-ahead before implementing.

## Ready for PR
- No
