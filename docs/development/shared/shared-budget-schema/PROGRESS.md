# Progress — F0-12 Budget buckets, fund top-ups, spending and summary calculation

Status: NOT STARTED
Owner: unclaimed
Lane: B — Backend
Sprint: SPRINT · planned D6
Branch: `feature/shared-budget-schema` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work
- OQ-03 — Budget threshold percentages
- OQ-04 — Funding model: buckets, categories and periods
- OQ-05 — Who can add funds and record spending; Budget History contents

## Dependencies status
- F0-06 — NOT STARTED
- F0-08 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `budget_buckets`: id, client_id, kind (per OQ-04; design shows NDIS, Fixed, Government), label, period_start, period_end.
- `budget_fund_entries` (top-ups, append-only): id, bucket_id, amount numeric(12,2) > 0, description, entry_date, recorded_by.
- `budget_expenses`: id, bucket_id, client_id, amount numeric(12,2) > 0, description, spent_on, event_id null, receipt_document_id null, recorded_by.
- View/function `budget_bucket_summary(client_id)` → total (sum of fund entries in period), used, remaining (may be negative), percent_used, threshold_state ('normal'|'warning'|'alert'|'depleted' using thresholds per OQ-03).
- Postgres functions `add_funds(bucket_id, amount, description, entry_date)` and `record_expense(...)` performing validated, atomic writes.
- RLS per OQ-05 (default PROPOSED: family manages funds; carer/admin read summaries; expense recording rights decided in OQ-05).
- TypeScript money formatting helper (AUD, no cents when whole, tabular) — display only; arithmetic stays in SQL.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/migrations/*_budget.sql`, `supabase/tests/budget.test.sql`, `src/lib/money/format.ts`, `src/lib/money/schema.ts`, `src/server/budget/queries.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01, OQ-03, OQ-04, OQ-05; then complete dependencies, run START FEATURE F0-12, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
