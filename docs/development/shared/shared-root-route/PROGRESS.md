# Progress — F0-19 Root route and production guard for dev previews

Status: MERGED TO DEV
Owner: Dhruv Verma
Lane: S — Shared
Sprint: SPRINT · planned D11
Branch: `feature/shared-root-route`
PR target: `main` (merged in #171, 2026-09-30)
Last updated: 2026-09-30

## Blockers
- None

## Dependencies status
- F0-07 — MERGED

## Acceptance criteria status
- 7 / 7 MET (AC-07 added by FD-06)

## Next action
- None; merged to `main`.

## Ready for PR
- Merged (see PR target above)

## Checks run locally (CI down)
- `npx vitest run`: all pass except F0-07 integration tests (hosted project returns "Invalid API key" 401, environment, not this change)
- `npm run typecheck` clean; `npm run lint` 0 errors (3 pre-existing warnings); prettier clean
- `env -u DATA_SOURCE npm run build` OK; `npx playwright test --grep-invert F0-07`: 47 passed, 2 skipped; production start with DATA_SOURCE unset returns 500 on a dashboard (AC-07)
- Test change: T-03 expected rewrite target regex corrected from a guess to `/not-found` (test bug, own test)
- Noted, out of scope: `/api/test` (F0-04 connectivity check) is still reachable in production
