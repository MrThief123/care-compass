# Progress — ADM-02 Admin — Staff list and add/edit staff

Status: READY FOR PR
Owner: MrThief123
Lane: A — Admin
Sprint: SPRINT · planned D8–D9
Branch: `feature/admin-staff`
PR target: `admin-dev`
Last updated: 2026-09-29

## Blockers
- None. OQ-08 and OQ-13 are ANSWERED (root DECISIONS.md); OQ-36 (non-blocking) is ADM-03's scope.

## Dependencies status
- F0-06 — MERGED TO DEV
- F0-07 — MERGED TO DEV
- ADM-UI-03 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- New migration `supabase/migrations/20260929000000_admin_staff.sql`: `admin_create_staff_profile`,
  `admin_update_staff`, `admin_discard_staff_invite` — SECURITY DEFINER RPCs, session-scoped, every
  `organisation_id` taken from the caller's own admin profile, never a parameter. 25 new pgTAP tests
  (`supabase/tests/admin_staff.test.sql`), full suite 426/426 green. `database.types.ts` regenerated.
- Out-of-lane `src/server/jobs/admin-invite-staff.ts` (one function: `inviteStaffAccount`), added with
  the human's explicit in-session approval since account creation needs the service-role client,
  which is lint-enforced to only be importable from `src/server/jobs/**` (Lane B's folder). See
  DECISIONS.md FD-01.
- `src/server/admin/staff-queries.ts` rewritten onto the canonical `StaffMember` domain type
  (firstName/lastName/jobTitle/isActive, PD-038), reading real `profiles` rows in Supabase mode
  (RLS-scoped, no manual org filter) and the shared `STAFF_MEMBERS` fixture (read-only reuse, not
  `src/mocks/admin-staff.ts`) in mock mode.
- `src/server/admin/staff-actions.ts` (new): `createStaff`/`updateStaff`, `ActionResult`-shaped,
  mock-mode via a new local mutable store (`staff-mock-store.ts`), Supabase-mode via the invite module
  + new RPCs, with compensating clean-up (`admin_discard_staff_invite`) if the profile insert fails
  after the invite succeeded.
- `src/features/admin-staff/staff-screen.tsx` reworked: Name field split into First name/Last name
  (PD-038), Save now calls the real actions (mock or supabase) instead of pure local state, matching
  the `events`/`budget` domains' established client-calls-server-action pattern.
- Tests: `staff-actions.test.ts` (mock-mode round trip + validation, unit), `staff-screen.test.tsx`
  (rewritten — component level, actions mocked, prefill/validation/row-update behaviour),
  `tests/integration/admin-staff.test.ts` (real invite + edit + cross-org rejection against local
  Supabase), `admin_staff.test.sql` (pgTAP, RLS/permission edge cases). See DECISIONS.md FD-01 for why
  T-01/T-03 moved from the plan's "e2e" to integration + component.

## In progress
- None

## Remaining
- None in ADM-02's own scope. The per-organisation *editable* job-title list (PD-038's "editable"
  wording) is not built — a gap, most likely ADM-10 Admin Settings' to close (DECISIONS.md FD-01).

## Acceptance criteria status
- 4 / 4 MET

## Tests
- Written: 1 new migration test file (25 pgTAP cases), 1 new unit file (5 cases), 1 rewritten
  component file (12 cases), 1 new integration file (3 cases)
- Passing: full `npx vitest run` — 2055 passed, 58 skipped (pre-existing, unrelated); `supabase test db`
  426/426; integration file 3/3; lint 0 errors, typecheck and format clean
- Failing: 0

## Files changed
- `supabase/migrations/20260929000000_admin_staff.sql` — new
- `supabase/tests/admin_staff.test.sql` — new
- `src/lib/supabase/database.types.ts` — regenerated (new RPCs only; reformatted with prettier to
  avoid CLI-version noise, see Problems encountered)
- `src/server/jobs/admin-invite-staff.ts` — new (out-of-lane, HUMAN REVIEW: see below)
- `src/server/admin/staff-mock-store.ts` — new
- `src/server/admin/staff-queries.ts` — rewritten onto canonical `StaffMember`
- `src/server/admin/staff-actions.ts` — new
- `src/server/admin/staff-actions.test.ts` — new
- `src/features/admin-staff/staff-screen.tsx` — reworked (First/Last name split, real actions)
- `src/features/admin-staff/staff-screen.test.tsx` — rewritten (HUMAN REVIEW: see below)
- `tests/integration/admin-staff.test.ts` — new
- `docs/development/admin-dev/admin-staff/{PRD,ACCEPTANCE_CRITERIA,TEST_PLAN,PROGRESS,SESSION_STATE,DECISIONS}.md`

## Decisions
- See DECISIONS.md FD-01 (out-of-lane jobs/ file, canonical type adoption, roles-list gap, test
  levels, shared fixture reuse — six related choices recorded together)

## Problems encountered
- `.env.local` in this checkout points at a hosted Supabase project; ran integration tests locally
  with `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`
  overridden inline (`supabase status`), same as FAM-10/ADM-01.
- The installed local Supabase CLI (v2.6.8, outdated) generates `database.types.ts` without trailing
  semicolons, a large pure-formatting diff against the committed style; ran `prettier --write` on the
  regenerated file before committing so the diff is just the new RPC signatures.
- Two integration tests unrelated to this feature (`shared-authentication` MFA/TOTP,
  `shared-sign-up`'s "already registered" count) failed only when the full `tests/integration/`
  suite ran in parallel; both pass cleanly in isolation. Pre-existing test-suite flakiness (shared
  fixture names colliding across files run concurrently against one local Postgres instance,
  and a local GoTrue TOTP config gap) — not caused by this feature's migration.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- `getAdminStaff()` does not filter `is_active`: shows every carer regardless of deactivation state.
  No AC covers this, and ADM-03 (not yet built) is where deactivated-staff list behaviour belongs.
- **HUMAN REVIEW: out-of-lane file.** `src/server/jobs/admin-invite-staff.ts` was added by this Lane A
  feature to Lane B's folder, with the human's explicit in-session approval (DECISIONS.md FD-01).
- **HUMAN REVIEW: test expectations changed.** `src/features/admin-staff/staff-screen.test.tsx` was
  fully rewritten — every test's field assertions changed (Name → First/Last name) because the form
  itself changed (human-approved canonical type adoption). See DECISIONS.md FD-01.
- **HUMAN REVIEW: dead mock file.** `src/mocks/admin-staff.ts` (`adminStaffFixture`) is no longer
  referenced by `getAdminStaff()`. Left in place (Lane S's file, not deleted here) — safe to remove in
  a Lane S cleanup PR.

## Next action
- Human review of the PR: the out-of-lane jobs/ file, the rewritten ADM-UI-03 tests, the roles-list
  gap, and the now-dead `src/mocks/admin-staff.ts`.

## Ready for PR
- Yes
