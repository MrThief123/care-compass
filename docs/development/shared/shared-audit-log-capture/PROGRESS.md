# Progress — F0-08 Append-only audit log capture

Status: READY FOR PR
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
- Tests first: `supabase/tests/audit_log.test.sql` (16 assertions) — confirmed failing (`relation "audit_log" does not exist`) before implementation
- `supabase/migrations/20260925000000_audit_log.sql`: `audit_log` table, RLS enabled with no policies, all grants revoked from anon/authenticated, append-only guard triggers (UPDATE/DELETE/TRUNCATE rejected for every role), generic `audit_row_change()` SECURITY DEFINER trigger function, and triggers attached to organisations, profiles, clients, client_family_members, carer_client_assignments, client_info_sections and shifts
- Attach pattern documented in ARCHITECTURE.md §6.1

## In progress
- None

## Remaining
- Human review, then PR to `main`

## Acceptance criteria status
- 3 / 3 MET

## Tests
- Written: 5 / 5 (T-01..T-03 plus supplementary T-04, T-02b)
- Passing: 5 (`supabase test db`: 31 assertions across 3 files, all green)
- Failing: 0

## Files changed
- `supabase/migrations/20260925000000_audit_log.sql`
- `supabase/tests/audit_log.test.sql`
- `ARCHITECTURE.md` (§6.1 attach pattern, as the PRD scope requires)
- Feature docs (PROGRESS, SESSION_STATE, DECISIONS, TEST_PLAN, ACCEPTANCE_CRITERIA)

## Decisions
- See DECISIONS.md

## Problems encountered
- `database.types.ts` on `main` is stale: it still has a `test` table no migration creates and lacks `shifts`. Regenerating it (`npm run db:types`) adds `audit_log` and `shifts` but breaks `typecheck` because `src/app/api/test/route.ts` (F0-04 smoke route) queries `from("test")`. That folder is outside this lane (CLAUDE.md §4.2), so the regeneration was reverted and left for a human decision (see DECISIONS.md FD-04).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human review of the diff; then open the PR to `main` (CLAUDE.md §8 — only with human approval).

## Ready for PR
- Yes — `npm run verify` green (515 unit tests), `supabase test db` green (31 assertions)
