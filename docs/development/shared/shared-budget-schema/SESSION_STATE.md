# Session State — F0-12 Budget buckets, fund top-ups, spending and summary calculation

Last session date: 2026-09-27
Current branch: `feature/shared-budget-schema` (from `main`)
Worked on: docs rewrite for CHG-020 / CHG-021 / CHG-022; tests written first
What changed: PRD, ACs, TEST_PLAN, DATA_MODEL, DECISIONS (FD-01 to FD-03); `supabase/tests/budget.test.sql`; `src/lib/money/schema.test.ts`; cents cases in `src/lib/format/money.test.ts`
Tests run: `supabase test db` (budget.test.sql), `vitest` for the two unit files
Test results: all new tests fail for the expected reason (no budget tables; no money schema; formatMoney rounds to dollars)
Current blocker: none; human review of FD-02 (no accounting period) and FD-03 (assumptions) requested before implementing
Important discoveries: `care_events` has no cost/bucket columns yet; admins cannot write events under F0-11 RLS, so an admin cannot set an event's cost (FD-03, needs its own change)
Important decisions: pending costs survive their event and carry over until paid (human, 2026-09-27)
Exact next action: after review, write `supabase/migrations/<timestamp>_budget.sql` per DATA_MODEL.md, then `src/lib/money/schema.ts` and cents in `formatMoney`; run until green
Files likely to be touched next: `supabase/migrations/*_budget.sql`, `src/lib/money/schema.ts`, `src/lib/format/money.ts`, `src/lib/supabase/database.types.ts`
Warning for next session: keep the completion charge in an AFTER INSERT trigger on `care_event_completions`; do not redefine `set_occurrence_done`. Existing care_events / audit_log tests must stay green.
