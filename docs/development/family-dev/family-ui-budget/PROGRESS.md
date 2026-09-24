# Progress — FAM-UI-05 Family Budget screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-budget` (created from `origin/family-dev` at 02c7fa7)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. Waiting for the human's greenlight to start implementation (tests-first is done; the tests are red).
- One human decision is open and does not block the build: FD-05 (should History also show who recorded an entry, PD-034?). The default in use follows the design, and the tests assert it (DECISIONS.md FD-05).

## Dependencies status
- F0-15 — MERGED
- UI-03 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed (`docs(family-ui-budget): claim`)
- Stop-and-ask on the missing History contract read and design fixtures: the human chose "On this branch as CHG-019". CHG-019 recorded in root `DECISIONS.md` (human-confirmed 2026-09-25).
- Feature `DECISIONS.md` written: FD-01 to FD-09 and the open-question table.
- Tests written first (84 tests in 5 files), run red for the right reasons (TEST_PLAN.md Results).

## In progress
- Nothing. Paused at the human's request until the greenlight.

## Remaining
- Route `/family/[clientId]/budget` inside the family layout: async page, `loading.tsx`.
- 'Funds by source' card with 'Update' primary button (no flow; says it is not available yet, FD-06).
- Three bucket cards from Home's `BudgetBucketTile` in an auto-fit grid (FD-01).
- History as a local container-query table: DATE · DESCRIPTION · AMOUNT (FD-03).
- `budget-format.ts` (`formatFundDate`, `formatSignedDollars`, FD-04) and `budget-data.ts` (`loadFamilyBudgetData`).
- Loading skeleton, empty states and error state (States sheet, OQ-24 defaults, FD-07).
- `getFundHistory` contract, mock and design-matching `FUND_ENTRIES` fixtures (CHG-019).
- Data only via `src/server/**` contract functions (mock data source).
- Read `node_modules/next/dist/docs/` for the pages, `loading.tsx` and `params` conventions first (CLAUDE.md §14).
- After the build: full local checks, real-browser design and width check, docs, then announce READY FOR PR and wait for "yes".

## Acceptance criteria status
- 0 / 3 MET (tests written and red; no production code yet)

## Tests
- Written: 84 (T-01..T-03 and the tests beyond them, TEST_PLAN.md)
- Passing: 6 (2 `getBudgetSummary` tests that already pass because that read is unchanged, and 4 fixture-shape tests that hold on today's fixtures)
- Failing: 11 run and fail, 67 fail at import because the modules they test do not exist yet

## Files changed
- `DECISIONS.md` — CHG-019
- `docs/development/family-dev/family-ui-budget/DECISIONS.md`, `TEST_PLAN.md`, `PROGRESS.md`, `SESSION_STATE.md`
- `src/features/family-budget/family-budget.test.tsx` (new)
- `src/features/family-budget/budget-format.test.ts` (new)
- `src/features/family-budget/budget-data.test.ts` (new)
- `src/server/budget/queries.test.ts` (new)
- `src/mocks/queries/budget.test.ts` (new)
- No production code changed. Planned, after the greenlight: `src/app/(family)/family/[clientId]/budget/page.tsx` and `loading.tsx`, `src/features/family-budget/*`, `src/server/budget/queries.ts` (Lane B, CHG-019), `src/mocks/queries/budget.ts` and `src/mocks/fixtures.ts` (Lane S, CHG-019).

## Decisions
- See DECISIONS.md (FD-01 to FD-09). Root `DECISIONS.md`: CHG-019.

## Problems encountered
- CHG-018 (Info's contracts) is on unmerged PR #89, so this branch's contract change is numbered CHG-019.
- A test file that imports a module that does not exist fails at load in Vite, even for a dynamic `import()` with a literal path. `family-budget.test.tsx` therefore imports `budget/loading` and the page statically (the Info precedent), and its red state is "module does not exist". Its per-test red state was checked once with that import stubbed (TEST_PLAN.md Results).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- OQ-24 (empty-state wording) is open; the default wording in use is flagged in FD-07.

## Next action
- Wait for the human's greenlight. Then implement the minimum to turn the tests green, in this order: `getFundHistory` and the fixtures (CHG-019), `budget-format.ts`, `budget-data.ts`, the view components, `page.tsx` and `loading.tsx`.

## Ready for PR
- No
