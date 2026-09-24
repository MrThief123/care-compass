# Progress — F0-08 Append-only audit log capture

Status: IN PROGRESS
Owner: Prajeet
Lane: B — Backend
Sprint: SPRINT · planned D4
Branch: `feature/shared-audit-log-capture`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-25

## Blockers
- None — OQ-01 ANSWERED (see root DECISIONS.md)

## Dependencies status
- F0-06 — MERGED TO DEV (merged to `main`)

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `audit_log` table: id, occurred_at, actor_id, actor_role, table_name, record_id, action (INSERT/UPDATE/DELETE), before jsonb, after jsonb, client_id (nullable, for scoping).
- Generic trigger function `audit_row_change()` using `auth.uid()`.
- Attach to tables from F0-06; document the one-line attach pattern in ARCHITECTURE.md for later tables.
- RLS: no UPDATE or DELETE policy for any role; INSERT only via trigger; SELECT policy none by default (viewer is parked PL-06).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/migrations/*_audit_log.sql`, `supabase/tests/audit_log.test.sql`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE F0-08, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
