# Progress — F0-12 Budget buckets, fund top-ups, spending and summary calculation

Status: IN PROGRESS
Owner: Prajeet
Lane: B — Backend
Sprint: SPRINT · planned D6
Branch: `feature/shared-budget-schema`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-27 (tests written first)

## Blockers
- None. OQ-01, OQ-03, OQ-04, OQ-05 are ANSWERED; F0-06 and F0-08 are merged. FD-02 / FD-03 in DECISIONS.md await human confirmation.

## Dependencies status
- F0-06 — MERGED · F0-08 — MERGED · F0-11 — MERGED (this feature adds `cost` and `bucket_id` to `care_events`)

## Completed
- Docs rewritten for CHG-020 / CHG-021 / CHG-022 (PRD scope, ACs, TEST_PLAN, DATA_MODEL, DECISIONS FD-01 to FD-03)
- Tests written first and run: all fail for the expected reason

## In progress
- Awaiting human review of the rewritten ACs and FD-02 / FD-03 before implementing

## Remaining
- Migration `supabase/migrations/*_budget.sql` (tables, functions, completion trigger, RLS, audit triggers)
- `src/lib/money/schema.ts`, cents in `src/lib/format/money.ts`
- `npm run db:types`, `src/server/budget/queries.ts` contract for supabase mode (only if in scope: FAM-10 connects data)

## Acceptance criteria status
- 0 / 15 MET

## Tests
- Written: 16 / 16 (T-01 to T-16; 132 pgTAP assertions in `supabase/tests/budget.test.sql`, 12 Vitest cases)
- Passing: 0
- Failing: all. pgTAP: `relation "budget_buckets" does not exist`. Vitest: `./schema` not found; `formatMoney(12.5)` gives `$13`, not `$12.50`.

## Files changed
- `docs/development/shared/shared-budget-schema/*`, `supabase/tests/budget.test.sql`, `src/lib/money/schema.test.ts`, `src/lib/format/money.test.ts`

## Decisions
- See DECISIONS.md (FD-01 to FD-03)

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human reviews FD-01 to FD-03; then implement the migration and money helpers until the tests pass.
## Ready for PR
- No
