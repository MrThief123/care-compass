# Progress — ADM-03 Admin — Deactivate staff

Status: IN PROGRESS (tests written, implementation not started)
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
- Feature docs rewritten with the human's answers (FD-01 to FD-05): PRD, ACCEPTANCE_CRITERIA (AC-01 to AC-09), TEST_PLAN, DECISIONS.
- Tests written first (all fail for the expected reason, see below).

## In progress
- None

## Remaining
- Migration (`supabase migration new`): `admin_deactivate_staff(p_profile_id uuid) returns profiles`.
- Regenerate `src/lib/supabase/database.types.ts` for the new function.
- `deactivateStaff` Server Action in `src/server/admin/staff-actions.ts`; `deactivateMockStaff` in `staff-mock-store.ts`.
- Staff screen: Deactivate button (carers only) + confirmation, "Inactive staff" section, notice and error states.
- Refresh status page; update DEVELOPMENT_PLAN card (criteria count) and root PROGRESS.md row in the PR docs commit.

## Acceptance criteria status
- 0 / 9 MET

## Tests
- Written: 10 (T-01 to T-10), 21 pgTAP assertions, 4 integration, 5 unit, 8 component
- Passing: 2 component tests that already hold today (no Inactive section when none; inactive name opens the panel with no Deactivate button)
- Failing (expected): pgTAP 19 of 21 (`admin_deactivate_staff` does not exist), integration 4 of 4 and unit 5 of 5 (`deactivateStaff` is not a function), component 6 of 8 (no Deactivate button / Inactive section)
- Integration run against the local stack: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 … npx vitest run tests/integration/admin-staff-deactivate.test.ts`

## Files changed
- Docs: `docs/development/admin-dev/admin-staff-deactivate/*`
- Tests: `supabase/tests/admin_staff_deactivate.test.sql`, `tests/integration/admin-staff-deactivate.test.ts`, `src/server/admin/staff-deactivate-actions.test.ts`, `src/features/admin-staff/staff-deactivate.test.tsx`
- Likely for implementation: `supabase/migrations/*_admin_deactivate_staff.sql`, `src/server/admin/staff-actions.ts`, `src/server/admin/staff-mock-store.ts`, `src/features/admin-staff/staff-screen.tsx`

## Decisions
- See DECISIONS.md (FD-01 to FD-05)

## Problems encountered
- None

## Assumptions
- None outstanding.

## Next action
- Implement against the failing tests (use the prompt in the hand-off), then run the suites in TEST_PLAN.md.

## Ready for PR
- No
