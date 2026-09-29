# Progress — FAM-10 Family — Budget overview and history

Status: MERGED TO DEV
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-budget-overview` (from `main`)
PR target: `main` (dashboard features now branch from and target `main` directly, not the dev branches) — merged as PR #161, 2026-09-29
Last updated: 2026-09-29

## Blockers
- None. OQ-04 and OQ-05 are ANSWERED (root DECISIONS.md).

## Dependencies status
- F0-12 — MERGED TO DEV
- FAM-UI-05 — MERGED TO DEV (PR #92, commit 2411316)

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Confirmed the screen (route, 'Funds by source' bucket cards, History table incl. CHG-020's
  pending-cost rows, empty state) and Home's 'View breakdown' link were already built and merged under
  FAM-UI-05 (PR #92) against mock data; `getBudgetSummary` was already wired to Supabase under FAM-03
  (commit f0b0874). None of this needed rebuilding.
- Wired `getFundHistory` to Supabase in `src/server/budget/queries.ts`: direct `budget_fund_entries` +
  `budget_costs` selects joined to `budget_buckets(kind)`, no new RPC or migration needed (RLS via the
  existing `can_read_budget`). Type is derived from sign for fund entries (`funds_added`/`bucket_added`
  are non-negative → topup; `funds_removed`/`bucket_removed` are negative → expense) and is always
  `expense` for costs (amount negated). `date` is `entry_date`/`incurred_on`; `paidOn` (CHG-022) is set
  only when a cost's `paid_on` differs from its `incurred_on` — i.e. it was pending before being paid —
  so a cost paid the same day it was incurred reads as a plain paid expense, matching the mock contract
  and `fundStatus()`'s "Paid" vs. "Paid on <date>" distinction in `src/features/family-budget/`.
- Tests: unit (`src/server/budget/queries.test.ts`, mock-mode, unchanged and still green) and a new
  Supabase integration test (`tests/integration/family-budget-overview.test.ts`) covering ordering, all
  four `FundEntry` shapes (topup, plain paid expense, pending-then-paid expense with `paidOn`, still-
  pending expense), the empty case and RLS (family, assigned carer, admin allowed; unrelated family and
  a carer off-shift see nothing) — following `tests/integration/family-home-budget-strip.test.ts`'s
  seed/RLS pattern. A new e2e test (`tests/e2e/family-budget-overview.spec.ts`) confirms 'View
  breakdown' opens the Budget page (AC-04).

## In progress
- None

## Remaining
- None in FAM-10's scope. FAM-11 (Update funds) and OQ-05's Update-flow design remain separately
  scoped; the Edit budget page FAM-UI-05 already shipped (CHG-021) covers much of that ground already.

## Acceptance criteria status
- 4 / 4 MET

## Tests
- Written: 2 new files (1 integration, 1 e2e); 1 existing unit test removed (see DECISIONS.md FD-01)
- Passing: full `npx vitest run` — 2047 passed, 64 skipped (pre-existing, unrelated); integration file
  9/9; e2e file 1/1 (and the rest of the family-dashboard e2e suite, 33/34, 1 pre-existing unrelated skip)
- Failing: 0

## Files changed
- `src/server/budget/queries.ts` — `getFundHistory`'s Supabase branch
- `src/server/budget/queries.test.ts` — removed the now-false "not implemented" supabase-mode test
  (HUMAN REVIEW: see below)
- `tests/integration/family-budget-overview.test.ts` — new
- `tests/e2e/family-budget-overview.spec.ts` — new
- `docs/development/family-dev/family-budget-overview/{PRD,ACCEPTANCE_CRITERIA,TEST_PLAN,PROGRESS,SESSION_STATE,DECISIONS}.md`

## Decisions
- See DECISIONS.md (FD-01: removed a test whose assertion this feature makes false by design)

## Problems encountered
- `.env.local` in this checkout points at a hosted Supabase project, so the integration suite skips by
  default here; ran it locally with `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/
  `SUPABASE_SERVICE_ROLE_KEY` overridden inline to the local stack's values (`supabase status`) rather
  than editing `.env.local`. CI/other machines should be unaffected as long as their own local-stack
  env vars are set the normal way.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- **HUMAN REVIEW: test expectation changed.** `src/server/budget/queries.test.ts`'s
  `[FAM-UI-05][PRD] getFundHistory throws the not-implemented error naming its domain and function` was
  removed, since FAM-10 wires exactly that function, making the assertion false. See DECISIONS.md FD-01
  for the reasoning and the replacement coverage.

## Next action
- None. PR #161 merged to `main` 2026-09-29.

## Ready for PR
- Merged (PR #161)
