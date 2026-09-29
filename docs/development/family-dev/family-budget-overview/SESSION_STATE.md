# Session State — FAM-10 Family — Budget overview and history

Last session date: 2026-09-29
Current branch: `feature/family-budget-overview`
Worked on: claiming FAM-10; confirmed dependencies merged and OQ-04/OQ-05 answered
What changed: PROGRESS.md/SESSION_STATE.md claimed
Tests run: none yet
Test results: n/a
Current blocker: none
Important discoveries: The screen (route, bucket cards, History table incl. CHG-020 pending rows) and
  Home's 'View breakdown' link were already built and merged under FAM-UI-05 (PR #92) against mock data;
  `getBudgetSummary` was already wired to Supabase under FAM-03. The only remaining gap is
  `getFundHistory` in `src/server/budget/queries.ts`, which still throws `notImplementedForSupabase` in
  Supabase mode — that's the real scope of this feature session.
Important decisions: none yet
Exact next action: Write/adjust tests for `getFundHistory`'s Supabase branch first (unit mapping tests
  in `src/server/budget/queries.test.ts`, replacing its "not implemented" supabase-mode test since
  behaviour is intentionally changing; an integration test in `tests/integration/` following
  `tests/integration/family-home-budget-strip.test.ts`'s seed/RLS pattern), then implement.
Files likely to be touched next: `src/server/budget/queries.ts`, `src/server/budget/queries.test.ts`,
  `tests/integration/family-budget-overview.test.ts`
Warning for next session: Do not touch `src/app/(family)/family/[clientId]/budget/**` or
  `src/features/family-budget/**` UI — that's FAM-UI-05's already-merged work, not FAM-10's scope.
