# Progress — F0-06 Identity, organisation and client access schema with RLS

Status: IN PROGRESS
Owner: Prajeet
Lane: B — Backend
Sprint: SPRINT · planned D3–D4
Branch: `feature/shared-tenancy-schema-rls`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-22

## Blockers
- None — OQ-01, OQ-07, OQ-09, OQ-16 all ANSWERED (see DECISIONS.md)

## Dependencies status
- F0-04 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Enum `app_role` (family, carer, admin).
- Tables: `organisations`, `profiles` (1:1 `auth.users`), `clients`, `client_family_members`, `carer_client_assignments`, `client_info_sections` — all with RLS enabled in the same migration (`supabase/migrations/20260922053821_tenancy.sql`).
- SQL helper functions (SECURITY DEFINER, stable, `search_path = public`): `current_profile()`, `is_family_of(client_id)`, `is_admin_of_client(client_id)`, `is_assigned_carer(client_id)`, plus `current_organisation_id()` (used by the `profiles`/`organisations` policies so they don't self-reference `profiles` under its own RLS).
- RLS policies: family reads own linked clients; admin reads clients whose current organisation is theirs; carer reads clients with an active (not-yet-started/not-yet-ended) assignment; inactive profiles (`is_active = false`) match no policy on any table.
- `client_info_sections`: family read/write, assigned carer read, admin none (per OQ-09).
- pgTAP suite `supabase/tests/tenancy_rls.test.sql` covering AC-01..AC-08 (family/admin/carer allow and deny cases, ended-assignment and deactivated-profile edge cases).
- `src/lib/supabase/database.types.ts` regenerated from the local schema (`npm run db:types`).

## In progress
- None

## Remaining
- None. The cross-organisation profile display-name view (PROPOSED in PRD scope) was confirmed by the human as not needed — see DECISIONS.md FD-01.

## Acceptance criteria status
- 8 / 8 MET

## Tests
- Written: 8 / 8 (all db-level, per TEST_PLAN.md's coverage mapping)
- Passing: 8
- Failing: 0

## Suite results
- `supabase test db`: PASS (8/8, `tenancy_rls.test.sql`)
- `npm run verify` (lint, typecheck, format:check, vitest): PASS — 421/421 tests, 60/60 suites. Pre-existing lint warnings in `scripts/plan-status.mjs` and `src/app/page.tsx` are unrelated to this feature and untouched.
- `npm run db:types`: regenerated and reformatted with prettier (was previously never generated against a real schema).

## Files changed
- `supabase/migrations/20260922053821_tenancy.sql` (new)
- `supabase/tests/tenancy_rls.test.sql` (new)
- `src/lib/supabase/database.types.ts` (regenerated)

## Decisions
- See DECISIONS.md

## Problems encountered
- Local Docker Desktop initially failed to mount the repo (`operation not permitted` creating `/host_mnt/Users/user/Documents`) until file-sharing access was granted in Docker Desktop settings (human action, one-time, machine-local — not a repo issue).
- `node_modules` was not installed in this worktree; ran `npm ci` before `npm run verify` would work.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md. The one PROPOSED item left unimplemented (cross-org profile display-name view) is listed under Remaining.

## Next action
- Human: review and, if approved, this branch is ready to open a PR to `main` (OQ-01, shared work).
- Once merged: F0-07, F0-08, F0-10 unblock (all depend only on F0-06 among lane-B features).

## Ready for PR
- Yes
