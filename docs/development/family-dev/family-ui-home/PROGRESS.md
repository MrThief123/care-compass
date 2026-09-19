# Progress — FAM-UI-01 Family Home screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D4
Branch: `feature/family-ui-home` (created from `origin/family-dev`)
PR target: `family-dev`
Last updated: 2026-09-19 (tests written, red)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — NOT STARTED
- UI-01 — NOT STARTED
- UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- Implementation of the Family Home screen against the failing tests (tests-first, CLAUDE.md §5).

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
- Written: 6 / 6 ACs, plus PRD Scope tests (commit `test(family): add Family Home screen tests`)
- Red run (before implementation, 2026-09-19): `src/features/family-home/family-home.test.tsx` 22 tests, 19 failed on assertions (stub page renders "Coming soon.", so no Today/Overdue/Recent activity/Budget regions and no error state), 3 passed vacuously (axe on the stub). `home-data.test.ts` failed to import `./home-data` (module not yet written). A temporary `loading.tsx` stub was used only to get past the missing-import error and was removed before committing.
- Passing: 0 meaningful (see red run)
- Failing: all AC tests
- Baseline before any change: `npx vitest run src` 49 files / 287 tests green; `npm run lint` 0 errors, 23 pre-existing warnings.

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
