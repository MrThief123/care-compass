# Progress — F0-10 Shifts schema, active-shift function and conflict query

Status: READY FOR PR
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
- `shifts` table: id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by, created_at, cancelled_at — with RLS enabled in the same migration (`supabase/migrations/20260923035510_shifts.sql`)
- Constraint `shifts_ends_after_starts` (ends_at > starts_at); `shifts_before_insert()` trigger validates the carer's organisation matches the client's organisation at insert and derives `organisation_id` from the client (not caller-supplied)
- Function `carer_on_active_shift(client_id)` → boolean, half-open interval `[starts_at, ends_at)`, excludes cancelled shifts
- Function `overlapping_shifts(carer_id, starts_at, ends_at)` → rows, used for a soft admin warning only (overlaps are never blocked, D30)
- RLS: admin of the client's organisation can select/insert/update (cancel = update setting `cancelled_at`); carer reads own shifts (`carer_id = auth.uid()`); family reads shifts for linked clients via `is_family_of()`
- pgTAP tests (`supabase/tests/shifts.test.sql`, T-01..T-07)

## In progress
- None

## Remaining
- None against this feature's ACs.

## Acceptance criteria status
- 7 / 7 MET

## Tests
- Written: 7 / 7
- Passing: 7
- Failing: 0

## Suite results
- `supabase test db`: PASS (15/15 across both files — 7 new + 8 unchanged from F0-06)
- `npm run test` (vitest): PASS — 429/429 tests, 61/61 files (unaffected, no TS changes in this feature)
- `npm run lint`, `npm run typecheck`, `npm run format:check`: all clean (pre-existing warnings in `scripts/plan-status.mjs` and `src/app/page.tsx` are unrelated and untouched)
- No e2e suite for this feature — db-only, no UI/route changes.

## Files changed
- New: `supabase/migrations/20260923035510_shifts.sql`, `supabase/tests/shifts.test.sql`

## Decisions
- See DECISIONS.md (FD-01: F0-06's carer RLS still reads the superseded `carer_client_assignments` model, not `shifts` — flagged as a non-blocking gap for later carer-facing features, not fixed in this feature)

## Problems encountered
- `throws_ok()`'s 2-arg form (sql, description) matches the error text loosely against the description string itself; passing the SQLSTATE `'42501'` alone as the second arg failed the match. Fixed by using the 4-arg form (sql, sqlstate, message pattern, description).
- DATA_MODEL.md's general rule mentions attaching an `audit_row_change()` trigger to every client-scoped table (F0-08 pattern). F0-08 (audit log) is not built yet and isn't a dependency of F0-10 — no such function exists to attach. Not applied here; will need to be added once F0-08 lands (likely alongside F0-11, which has the same gap).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- Family sees the full shift row (not just carer display name) — OQ-13 (column-level restriction) is non-blocking and PROPOSED; a column-restricted view can be added later without changing this migration's RLS shape.
- Admin also has explicit SELECT on shifts (not just insert/update), consistent with F0-06's pattern for other admin-managed tables and needed for any future Admin Manage UI (ADM-07, out of scope here) to list shifts.

## Next action
- None against this feature. Human: review and, if approved, open the PR to `main` (OQ-01, shared work).
- Once merged: F0-11, CAR-01, CAR-03, CAR-02, CAR-04, CAR-05, CAR-06, ADM-07, FAM-13, F0-16 unblock on this dependency (each still has its own other dependencies).
- Flagged for later (see DECISIONS.md FD-01): F0-06's `clients_select_carer`/`client_info_sections_select` RLS needs to be repointed at `shifts` per PD-041 before carer-facing features can show carers any clients.

## Ready for PR
- Yes
