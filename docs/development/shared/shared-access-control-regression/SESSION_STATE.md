# Session State — INT-05 Access-control regression matrix

Last session date: 2026-10-02
Current branch: `feature/shared-access-control-regression`
Worked on: Full implementation — both ACs
What changed:
- Added `supabase/tests/access_control_regression.test.sql` (T-01, AC-01)
- Added `tests/integration/shared-access-control-regression.test.ts` (T-02, AC-02; behavioural matrix + static route-coverage)
- Added `scripts/generate-permission-matrix.mjs` and the `security:permission-matrix` npm script
- Generated `docs/security/PERMISSION_MATRIX.md`
- Stood up the local dev environment to actually run everything: installed Node v24.21.0, Docker Desktop, ran `supabase start` (migrations + seed applied), populated `.env.local`
Tests run: `supabase test db` (711 pgTAP tests, 24 files, all pass); `npx vitest run tests/integration/shared-access-control-regression.test.ts` (9/9 pass); full `tests/integration/` suite run for regressions (2 pre-existing unrelated failures confirmed, see DECISIONS.md FD-01); `tsc --noEmit` clean; `eslint`/`prettier` clean on all new files
Test results: AC-01 MET (16/16 tables RLS-enabled), AC-02 MET (6/6 behavioural redirects correct, 26/26 dashboard routes guarded)
Current blocker: none
Important discoveries:
- An admin actor must complete TOTP enrolment before `evaluateRoleGuard` reaches the role-mismatch check — the MFA gate (OQ-08) runs first in `resolveActiveProfile`. Test fixed to enrol+verify TOTP for admin profiles first (same sequence as F0-07's AC-10 test).
- Two unrelated pre-existing integration test failures exist on `main` (F0-16, F0-17) — confirmed independent of this feature, not fixed here.
Important decisions: FD-01 (see DECISIONS.md) — pre-existing unrelated failures not fixed in this feature's scope.
Exact next action: None — PR #209 open (https://github.com/MrThief123/care-compass/pull/209), status page refreshed. Waiting on human/reviewer merge.
Files touched: `supabase/tests/access_control_regression.test.sql`, `tests/integration/shared-access-control-regression.test.ts`, `scripts/generate-permission-matrix.mjs`, `docs/security/PERMISSION_MATRIX.md`, `package.json`, this feature's `PROGRESS.md`/`ACCEPTANCE_CRITERIA.md`/`TEST_PLAN.md`/`DECISIONS.md`/`SESSION_STATE.md`
Warning for next session: `.env.local` and the local Supabase stack (`supabase start`) must stay set up to re-run `supabase test db` or the integration suite — if Docker was stopped, run `supabase start` again first.
