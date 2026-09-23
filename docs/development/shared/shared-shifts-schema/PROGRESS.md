# Progress — F0-10 Shifts schema, active-shift function and conflict query

Status: IN PROGRESS
Owner: Prajeet
Lane: B — Backend
Sprint: SPRINT · planned D4–D5
Branch: `feature/shared-shifts-schema`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-23

## Blockers
- None — OQ-01, OQ-09 both ANSWERED (see root DECISIONS.md PD-041; supersedes this file's stale proposed defaults below)

## Dependencies status
- F0-06 — MERGED TO DEV (merged to `main`, PR #66/earlier)

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `shifts` table: id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by, created_at, cancelled_at null.
- Constraints: ends_at > starts_at; carer's organisation = client's current organisation at insert (trigger).
- Function `carer_on_active_shift(client_id)` → boolean for auth.uid() at now().
- Function `overlapping_shifts(carer_id, starts_at, ends_at)` → rows (used for soft warning).
- No separate `carer_client_assignments` table (PD-041 supersedes the earlier proposed default): carer↔client visibility and edit access are derived directly from `shifts` rows (any current/future shift = read visibility; `start_time ≤ now < end_time` = edit access). RLS policies query `shifts` directly.
- RLS: admin of the client's organisation can insert/update/cancel; carer can read own shifts; family can read shifts for linked clients (carer display name only).
- pgTAP tests.

## Acceptance criteria status
- 0 / 7 MET

## Tests
- Written: 0 / 7
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/migrations/*_shifts.sql`, `supabase/tests/shifts.test.sql`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Read PRD.md, ACCEPTANCE_CRITERIA.md, TEST_PLAN.md, DATA_MODEL.md; write TEST_PLAN.md's tests first (pgTAP), confirm they fail, then implement the migration.

## Ready for PR
- No
