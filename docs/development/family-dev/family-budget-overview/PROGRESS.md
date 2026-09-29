# Progress — FAM-10 Family — Budget overview and history

Status: IN PROGRESS
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-budget-overview`
PR target: `family-dev`
Last updated: 2026-09-29

## Blockers
- None. OQ-04 and OQ-05 are ANSWERED (root DECISIONS.md).

## Dependencies status
- F0-12 — MERGED TO DEV
- FAM-UI-05 — MERGED TO DEV (PR #92, commit 2411316)

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- Route `/family/[clientId]/budget`, the 'Funds by source' bucket cards and the History table were
  already built on fixtures under FAM-UI-05 (PR #92), including CHG-020's pending-cost rows in History.
  Home's 'View breakdown' link (`homeRoutes.budget`) already points at this route, and `getBudgetSummary`
  was wired to Supabase under FAM-03 (commit f0b0874). The one remaining gap: `getFundHistory` in
  `src/server/budget/queries.ts` still throws `notImplementedForSupabase` in Supabase mode. Wiring that
  is this session's scope.

## Remaining
- Wire `getFundHistory` to Supabase (direct `budget_fund_entries` + `budget_costs` selects, RLS via
  `can_read_budget`) and add tests.

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/budget/page.tsx`, `src/features/family-budget/history-table.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-04, OQ-05; then complete dependencies, run START FEATURE FAM-10, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
