# Progress — FAM-03 Family Home — Budget strip

Status: READY FOR PR
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D8
Branch: `feature/family-home-budget-strip`
PR target: `family-dev`
Last updated: 2026-09-28

## Blockers
- None — OQ-03 and OQ-04 are ANSWERED (root DECISIONS.md)

## Dependencies status
- F0-12 — MERGED
- FAM-UI-01 — MERGED

## Completed
- Traced the gap: FAM-UI-01 already built and tested `BudgetStrip`/`BudgetBucketTile` and wired
  the Home page's loader to call `getBudgetSummary` — the only real gap was that function's
  Supabase branch, which threw `notImplementedForSupabase`.
- Regenerated `database.types.ts` (stale since before F0-12 merged — FD-01) so
  `budget_bucket_summary` is typed.
- Wrote `tests/integration/family-home-budget-strip.test.ts` first (8 tests: AC-02/AC-03/AC-04
  against real seeded data, plus RLS scope tests and the pending-cost/'exhausted' rule); confirmed
  all 8 failed with `notImplementedForSupabase` before writing any production code.
- Implemented `getBudgetSummary`'s Supabase branch in `src/server/budget/queries.ts`: calls the
  `budget_bucket_summary` RPC and maps its fields, including the threshold-state word mapping.
- Cherry-picked an unrelated, already-fixed CI bug (`carer_client_assignments` still seeded by
  `budget.test.sql` and two Vitest integration tests) this branch had inherited from `family-dev`;
  see SESSION_STATE.md.

## In progress
- None

## Remaining
- None in FAM-03's scope as documented.

## Acceptance criteria status
- 4 / 4 MET

## Tests
- Written: 8 (T-02, T-03, T-04 at integration level, plus 4 `[Scope]` RLS/business-rule tests
  beyond TEST_PLAN's own list — see DECISIONS.md FD-02); T-01 already covered by FAM-UI-01
- Passing: all (`supabase test db`, the new integration file, the full `tests/integration` suite,
  the full Vitest suite, `npm run typecheck`, `npm run lint`, `npx prettier --check .`,
  `npm run build`, and this dashboard's Playwright e2e specs)
- Failing: 0

## Files changed
- `src/server/budget/queries.ts` — `getBudgetSummary`'s Supabase branch
- `src/lib/supabase/database.types.ts` — regenerated
- `tests/integration/family-home-budget-strip.test.ts` — new

## Decisions
- See DECISIONS.md (FD-01 — types regeneration, FD-02 — integration tests added beyond TEST_PLAN)

## Problems encountered
- The local integration suite is flaky under file-parallelism: an unrelated
  `shared-sign-up.test.ts` count assertion (`[F0-17][AC-04]`) raced against other files' seeded
  'Doyle' profiles in one parallel run. Passed cleanly alone and with `--no-file-parallelism`;
  not caused by this feature (F0-18's own PROGRESS.md recorded the same class of flake).
- `[F0-07][AC-10]` (TOTP) fails locally — pre-existing, local Supabase has TOTP enroll disabled.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human review; then push (already pushed) and open the PR to `family-dev`.

## Ready for PR
- Yes
