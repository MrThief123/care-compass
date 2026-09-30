# Progress — F0-19 Root route and production guard for dev previews

Status: READY FOR PR
Owner: Dhruv Verma
Lane: S — Shared
Sprint: SPRINT · planned D11
Branch: `feature/shared-root-route`
PR target: `main`
Last updated: 2026-09-30

## Blockers
- None

## Dependencies status
- F0-07 — MERGED

## Acceptance criteria status
- 6 / 6 MET

## Next action
- Human go-ahead, then open the PR to `main` (docs update ships inside it).

## Ready for PR
- Yes, awaiting human approval

## Checks run locally (CI down)
- `npx vitest run`: all pass except F0-07 integration tests (hosted project returns "Invalid API key" 401, environment, not this change)
- `npm run typecheck` clean; `npm run lint` 0 errors (3 pre-existing warnings); prettier clean
- `npm run build` then `npx playwright test root-route smoke`: 6 passed
- Test change: T-03 expected rewrite target regex corrected from a guess to `/not-found` (test bug, own test)
- Noted, out of scope: `/api/test` (F0-04 connectivity check) is still reachable in production
