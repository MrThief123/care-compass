# Progress — F0-10 Shifts schema, active-shift function and conflict query

Status: NOT STARTED
Owner: unclaimed
Lane: B — Backend
Sprint: SPRINT · planned D4–D5
Branch: `feature/shared-shifts-schema` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work
- OQ-09 — Carer access model

## Dependencies status
- F0-06 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `shifts` table: id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by, created_at, cancelled_at null.
- Constraints: ends_at > starts_at; carer's organisation = client's current organisation at insert (trigger).
- Function `carer_on_active_shift(client_id)` → boolean for auth.uid() at now().
- Function `overlapping_shifts(carer_id, starts_at, ends_at)` → rows (used for soft warning).
- Behaviour of carer_client_assignments on shift insert per OQ-09 answer.
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
- Wait for answers to OQ-01, OQ-09; then complete dependencies, run START FEATURE F0-10, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
