# Progress — INT-01 Automatic budget threshold emails

Status: NOT STARTED
Owner: unclaimed
Lane: B — Backend
Sprint: STRETCH · planned D11–D12
Branch: `feature/shared-budget-threshold-emails` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work
- OQ-03 — Budget threshold percentages
- OQ-17 — Hosting, email, scheduler, environments and availability
- OQ-28 — Budget email recipients and budget period

## Dependencies status
- F0-12 — NOT STARTED
- FAM-10 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `budget_threshold_notifications` (bucket_id, threshold, period_start, sent_at) unique(bucket_id, threshold, period_start).
- Job `src/server/jobs/budget-thresholds.ts` using the service-role client; invoked by scheduler (OQ-17) via protected Route Handler `/api/jobs/budget-thresholds` with secret header.
- Email template: 'The Schedule of Care Program for <CLIENT NAME> has reached <N>% of its allocation for the present period. Log in and refer to plan.' (CIS5 wording; program name configurable).
- Recipients per OQ-28; exclude users from organisations no longer serving the client and inactive profiles.
- Email provider adapter interface with a test double.

## Acceptance criteria status
- 0 / 5 MET

## Tests
- Written: 0 / 5
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/server/jobs/budget-thresholds.ts`, `src/app/api/jobs/budget-thresholds/route.ts`, `src/server/email/*`, `supabase/migrations/*_threshold_notifications.sql`, `tests/integration/budget-thresholds.test.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01, OQ-03, OQ-17, OQ-28; then complete dependencies, run START FEATURE INT-01, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
