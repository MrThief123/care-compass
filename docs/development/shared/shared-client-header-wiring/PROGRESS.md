# Progress — F0-20 Client header wiring and family route guard

Status: READY FOR PR (awaiting human approval)
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
- 8 / 8 MET

## Next action
- Human approves, then open the PR to `main` (title `F0-20 Client header wiring and family route guard`).

## Ready for PR
- Yes, awaiting the human's approval to open it.

## Tests written first (2026-10-01)
- T-01, T-02 (`src/server/clients/header-summary.test.ts`, 14 tests), T-03 (`layout.test.tsx`), T-04 (`layout.mock.test.tsx`), T-05 (`tests/integration/shared-client-header-wiring.test.ts`, 6 tests, run against local Supabase).
- Confirmed failing for the right reason: Supabase branch throws `notImplementedForSupabase`; `assertClientAccess` does not exist; layout still runs `Promise.all` and has no access check. Integration seed/sign-in setup works (failures are the missing code only).
- T-04 passes already (mock-mode regression guard).
- Typecheck errors were expected until `assertClientAccess` existed; it now does.

## Checks run locally (CI down)
- `npx vitest run src/server/clients/header-summary.test.ts "src/app/(family)/family/[clientId]"`: 14 files, 149 tests passed.
- `npx vitest run tests/integration/shared-client-header-wiring.test.ts` with the local Supabase env (`.env.local` in this worktree, gitignored): 6 / 6 passed.
- `npx vitest run` (full, local Supabase env, mock data source): 198 files passed, 2 failed, 2368 tests passed, 3 failed. The 3 failures are in `tests/integration/family-home-budget-strip.test.ts` (2) and `shared-dev-seed-data.test.ts` (1, an extra document row left in the local DB by other test runs). Neither touches code changed here; not re-run on `main`.
- `npm run typecheck`: clean.
- `npm run lint`: 0 errors, 2 warnings (`src/app/dev-preview/page.tsx`, import order, not in this change).
- `npx prettier --check .`: clean.
- Visual check against local Supabase: see SESSION_STATE.md.
