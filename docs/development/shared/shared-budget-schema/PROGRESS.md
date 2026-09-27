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
- Awaiting human review of FD-02 / FD-03 and the PR

## Remaining
- Regenerating `src/lib/supabase/database.types.ts` (see Problems); `src/server/budget/queries.ts` supabase mode is FAM-10's (connects data)
- Run e2e against local Supabase before the PR

## Acceptance criteria status
- 18 / 18 MET

**HUMAN REVIEW: test expectation changed** — T-11 / AC-11 (events move to a Miscellaneous bucket instead of losing their cost); see DECISIONS.md FD-05.

## Tests
- Written: 19 / 19 (T-01 to T-19; 163 pgTAP assertions)
- Passing: 19 / 19. `supabase test db`: 7 files, 266 tests pass (budget.test.sql 132). `npm run verify`: lint 0 errors, typecheck, format, 1839 Vitest tests pass.
- Failing: 0

## Files changed
- `supabase/migrations/20260927000000_budget.sql`, `supabase/tests/budget.test.sql`, `src/lib/money/schema.ts` (+ test), `src/lib/format/money.ts` (+ test), docs in this folder

## Decisions
- See DECISIONS.md (FD-01 to FD-03)

## Problems encountered
- `npm run db:types` regenerates `database.types.ts` from an empty stub to all 14 tables (about 1,500 changed lines) and then `src/app/api/test/route.ts` fails typecheck because it queries a table `test` that does not exist. That file is outside this lane, so I reverted the regeneration; the types file is unchanged. Needs a decision (FD-04).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human reviews FD-01 to FD-04; on approval, push and open the PR to `main`.
## Ready for PR
- No
