# Progress — ADM-07 Admin — Assign shift

Status: MERGED TO DEV (merged to `main` in #193, 2026-10-01)
Owner: MrThief123
Lane: A — Admin
Sprint: SPRINT · planned D10
Branch: `feature/admin-assign-shift`
PR target: `main` (CHG-036; PRD.md's `admin-dev` is the retired pre-CHG-036 value)
Last updated: 2026-10-02

## Blockers
- None (OQ-09 ANSWERED). FD-01, FD-05 and FD-06 confirmed by the human on 2026-10-01 (DECISIONS.md). The `overlapping_shifts` caller check shipped in F0-21 (migration `20261001123254`).

## Dependencies status
- F0-10 — MERGED
- ADM-06 — MERGED (#176)

## Completed
- Claimed (2026-10-01).
- Tests written first and run red (2026-10-01):
  - `src/server/admin/manage-actions.test.ts` — 8/8 failed: `@/server/admin/manage-actions` did not exist.
  - `src/features/admin-manage/assign-shift.test.tsx` — 5/8 failed: Assign never called a server action, no server error shown, overlap warning said "another client" for a client not in the (searched) list. 3 passed already because ADM-UI-02 built them on fixtures (client-side time validation, no Repeat, axe) — expected for a wiring feature.
  - `tests/integration/admin-assign-shift.test.ts` (local Supabase) — 5/6 failed: action missing; `getAdminManage` returned no shifts in Supabase mode. 1 passed trivially (other org's admin sees no shifts — none were loaded).
  - `tests/e2e/admin-assign-shift.spec.ts` (T-01) written.
- Implemented:
  - `assignShift` Server Action (`src/server/admin/manage-actions.ts`): Zod-validated, Melbourne date/time → `timestamptz`, insert under the admin's session (F0-10 RLS + org trigger decide permission), `{ ok, data | error }` result.
  - Shared schema `src/server/admin/assign-shift-schema.ts` (screen and action use the same rule and message).
  - `getAdminManage` Supabase branch now loads the organisation's shifts with carer/client names (`toManageShift`).
  - Manage screen calls the action; shows server errors; disables Assign while saving; warning and bookings use names carried on the shift.
- All tests green; relevant suite run (see Tests).

## In progress
- None

## Remaining
- None. Merged in #193.

## Acceptance criteria status
- 4 / 4 MET (AC-01 MET incl. e2e; AC-02; AC-03; AC-04)

## Tests
- Written: 4 / 4 TEST_PLAN cases (T-01 e2e, T-02, T-03, T-04 component) plus action unit tests and integration tests (RLS negative cases)
- Passing: all
- Failing: 0
- Commands run (2026-10-01):
  - `npx vitest run src/server/admin src/features/admin-manage` — 11 files, 65 tests passed
  - local Supabase: `npx vitest run tests/integration/admin-assign-shift.test.ts tests/integration/admin-manage-selection.test.ts` — 10/10 passed
  - local Supabase: `npm run test` — 2495 passed, 5 failed, all 5 outside this feature: `shared-dev-seed-data` (4) and `shared-sign-up` AC-04 (1) fail with "Invalid login credentials" because the shared local stack doesn't currently hold the F0-16 seed users (not reseeded: only Lane B resets the stack)
  - `supabase test db` — 19 files, 540 tests, PASS (no schema change in this feature)
  - local Supabase build + `E2E_PORT=3107 E2E_DATA_SOURCE=supabase npx playwright test tests/e2e/admin-assign-shift.spec.ts` — 1 passed
  - `npx tsc --noEmit` — clean; `npm run lint` — 0 errors (2 existing warnings in `src/app/dev-preview/page.tsx`); `npx prettier --check` on changed files — clean

## Files changed
- `src/server/admin/manage-actions.ts` (new), `src/server/admin/manage-actions.test.ts` (new)
- `src/server/admin/assign-shift-schema.ts` (new)
- `src/server/admin/manage-queries.ts`
- `src/features/admin-manage/manage-screen.tsx`, `src/features/admin-manage/assign-shift.test.tsx` (new)
- `tests/integration/admin-assign-shift.test.ts` (new), `tests/e2e/admin-assign-shift.spec.ts` (new)
- No migration; no shared-kit (`src/components/**`) change.

## Decisions
- See DECISIONS.md (FD-01..FD-08)

## Problems encountered
- `overlapping_shifts` (F0-10) is SECURITY DEFINER with no caller check — not used from the app; flagged for Lane B (FD-01).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until answered in DECISIONS.md (FD-05, FD-06).

## Next action
- Human confirms FD-01/FD-05/FD-06 and approves the PR; then merge `origin/main`, re-run the suite, open PR `ADM-07 Admin — Assign shift` to `main`.

## Ready for PR
- No — awaiting human confirmation and PR approval
