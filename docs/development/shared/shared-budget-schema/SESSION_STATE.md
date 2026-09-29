# Session State — F0-12 Budget buckets, fund top-ups, spending and summary calculation

Last session date: 2026-09-27
Current branch: `feature/shared-budget-schema` (from `main`)
Worked on: migration `20260927000000_budget.sql`, money schema, cents in formatMoney
What changed: PRD, ACs, TEST_PLAN, DATA_MODEL, DECISIONS (FD-01 to FD-03); `supabase/tests/budget.test.sql`; `src/lib/money/schema.test.ts`; cents cases in `src/lib/format/money.test.ts`
Tests run: `supabase test db`, `npm run verify`
Test results: all green (pgTAP 7 files, Vitest 1839)
Current blocker: none
Important discoveries: `care_events` has no cost/bucket columns yet; admins cannot write events under F0-11 RLS, so an admin cannot set an event's cost (FD-03, needs its own change)
Important decisions: pending costs survive their event and carry over until paid (human, 2026-09-27)
Exact next action: human reviews FD-01 to FD-04; then push, run e2e against local Supabase, and open the PR to `main` with human approval
Files likely to be touched next: `supabase/migrations/*_budget.sql`, `src/lib/money/schema.ts`, `src/lib/format/money.ts`, `src/lib/supabase/database.types.ts`
Warning for next session: keep the completion charge in an AFTER INSERT trigger on `care_event_completions`; do not redefine `set_occurrence_done`. Existing care_events / audit_log tests must stay green.
