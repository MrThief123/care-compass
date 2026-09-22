# Session State — F0-06 Identity, organisation and client access schema with RLS

Last session date: 2026-09-22
Current branch: `feature/shared-tenancy-schema-rls` (claimed from `main`, pushed)
Worked on: implemented the full PRD scope test-first — pgTAP suite written and confirmed failing (relation "organisations" does not exist), then the migration implementing enum, tables, RLS-enabling helper functions and policies, then confirmed all 8 tests pass.
What changed: `supabase/migrations/20260922053821_tenancy.sql` (new), `supabase/tests/tenancy_rls.test.sql` (new), `src/lib/supabase/database.types.ts` (regenerated); feature PROGRESS.md, ACCEPTANCE_CRITERIA.md, TEST_PLAN.md updated to MET/PASS.
Tests run: `supabase test db` (8/8 pass), `npm run verify` (lint, typecheck, format:check, vitest — all green, 421/421 tests).
Test results: all green; no known failures.
Current blocker: none — feature merged to `main` via PR #65.
Important discoveries:
- Local dev machine needed Supabase CLI installed (`brew install supabase/tap/supabase`) and Docker Desktop granted file-sharing access to `/Users/user/Documents` before `supabase start` would mount the repo — one-time machine setup, not a repo defect.
- `node_modules` was not present in this worktree; `npm ci` was required before typecheck/test would run.
- Self-referential RLS policies on `profiles` (a policy on `profiles` subquerying `profiles`) work in Postgres but are avoided here via a `current_organisation_id()` SECURITY DEFINER helper for clarity and to sidestep any recursion-detection edge cases.
Important decisions: none new — implementation followed PRD.md/DATA_MODEL.md as written; no PROPOSED item needed a call except leaving the cross-org profile display-name view unimplemented (no AC covers it — see PROGRESS.md "Remaining").
Exact next action: none for this feature — merged to `main` via PR #65. Lane-B features F0-07, F0-08, F0-10 are now unblocked.
Files likely to be touched next: none for this feature — scope is complete pending PR/merge.
Warning for next session: `.env.local` was created locally (gitignored) pointing at the local Supabase stack so integration tests can run; regenerate via `supabase status -o env` if the stack is restarted with new keys.
