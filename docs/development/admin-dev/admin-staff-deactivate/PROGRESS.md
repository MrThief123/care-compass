# Progress — ADM-03 Admin — Deactivate staff

Status: MERGED TO DEV (merged to `main` in #211, 2026-10-02)
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D15
Branch: `feature/admin-staff-deactivate`
PR target: `main`
Last updated: 2026-10-02

## Blockers
- None. OQ-36 = PD-039 and OQ-19 = PD-052 are answered. Dependency ADM-02 is merged.

## Dependencies status
- ADM-02 — MERGED

## Completed
- Feature docs rewritten with the human's answers (FD-01 to FD-07): PRD, ACCEPTANCE_CRITERIA (AC-01 to AC-09), TEST_PLAN, DECISIONS.
- Tests written first (all failed for the expected reason).
- Migration `20261002130424_admin_deactivate_staff.sql`: `admin_deactivate_staff`, `is_admin_of_organisation`, policy `profiles_select_inactive_carers_for_admin` (FD-06). `database.types.ts` updated by hand (two entries; a full regenerate reformats the whole file).
- `deactivateStaff` Server Action and `deactivateMockStaff` mock store function.
- Staff screen: Deactivate button (active carers only) with confirmation, "Inactive staff" section with tag, success notice, failure alert; `StaffTable` extracted so both lists share it.

## In progress
- None

## Remaining
- Human approval to open the PR (CLAUDE.md §8). PR body: "design gap, built from tokens, please review" (PD-052); note the AC-02 "Marcus Chen" naming; note FD-06 (RLS policy).

## Acceptance criteria status
- 9 / 9 MET

## Tests
- Written first: 10 (T-01 to T-10: 21 pgTAP assertions, 4 integration, 5 unit, 8 component) plus T-11 added with FD-06 (6 pgTAP assertions).
- Passing: all of the above. Commands run on this branch after merging `origin/main`:
  - `npx vitest run src/features/admin-staff src/server/admin`: 13 files, 81 tests passed
  - `npx supabase test db supabase/tests/admin_staff_deactivate.test.sql`: 21/21; full `npx supabase test db`: 28 files, 821 tests, PASS (before T-11 file was added; T-11 file alone 6/6)
  - `npx vitest run tests/integration/admin-staff-deactivate.test.ts` with the local-stack env vars: 4/4
  - `npx tsc --noEmit`: clean; `npm run lint`: 0 errors (3 warnings, none in files changed here)
  - Playwright `tests/e2e/admin-*.spec.ts` + `shared-app-shell.spec.ts` + `auth-hardening.spec.ts` with `--grep-invert "F0-07"`: mock build 5 passed / 11 skipped (real-data specs); local-Supabase build (`E2E_DATA_SOURCE=supabase`) 16 passed; the 5 shell specs are mock-only and fail in supabase mode (they passed in mock mode)
  - Full `npx vitest run`: 2379 passed, 197 failed in 14 files outside ADM-03, see DECISIONS FD-07 (re-run of 5 of them with this branch's changes stashed: same 41 failures)
- Browser check (Playwright, mock mode, widths 1920/1440/1024/768): flow works, no horizontal overflow, dialog fits.

## Files changed
- Docs: `docs/development/admin-dev/admin-staff-deactivate/*`, `DEVELOPMENT_PLAN.md` card, root `PROGRESS.md`, `care-compass-status.html`
- Tests: the four from the START session; `supabase/tests/admin_inactive_carers_rls.test.sql` (new)
- Code: `supabase/migrations/20261002130424_admin_deactivate_staff.sql`, `src/lib/supabase/database.types.ts`, `src/server/admin/staff-actions.ts`, `src/server/admin/staff-mock-store.ts`, `src/features/admin-staff/staff-screen.tsx`

## Decisions
- See DECISIONS.md (FD-01 to FD-07)

## Problems encountered
- T-10 initially failed because RLS hid the inactive carer from the admin: fixed with FD-06 (policy), not a test change.

## Assumptions
- None outstanding.

## Next action
- Announce readiness; on the human's "yes", open the PR to `main` titled `ADM-03 Admin — Deactivate staff`.

## Ready for PR
- Yes (awaiting human approval)
