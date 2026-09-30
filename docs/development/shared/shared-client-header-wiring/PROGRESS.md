# Progress — F0-20 Client header wiring and family route guard

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared
Sprint: SPRINT
Branch: `feature/shared-client-header-wiring`
PR target: `main`
Last updated: 2026-10-01

## Blockers
- None. Must merge before FAM-01 (`feature/family-home-today`) starts.

## Dependencies status
- F0-06, F0-07, F0-15, FAM-13 (`list_organisations_for_transfer`) — MERGED

## Acceptance criteria status
- 0 / 8 MET

## Next action
- Implement in a fresh session: `getClientHeaderSummary` Supabase branch, `assertClientAccess`, `age?` optional, layout order, then update the Settings page if it needs the optional age.

## Ready for PR
- No

## Tests written first (2026-10-01)
- T-01, T-02 (`src/server/clients/header-summary.test.ts`, 14 tests), T-03 (`layout.test.tsx`), T-04 (`layout.mock.test.tsx`), T-05 (`tests/integration/shared-client-header-wiring.test.ts`, 6 tests, run against local Supabase).
- Confirmed failing for the right reason: Supabase branch throws `notImplementedForSupabase`; `assertClientAccess` does not exist; layout still runs `Promise.all` and has no access check. Integration seed/sign-in setup works (failures are the missing code only).
- T-04 passes already (mock-mode regression guard).
- Typecheck errors are expected until `assertClientAccess` exists.

## Checks run locally (CI down)
- None yet
