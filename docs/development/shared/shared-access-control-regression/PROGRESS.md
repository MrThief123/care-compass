# Progress — INT-05 Access-control regression matrix

Status: MERGED TO DEV (merged to `main` in #209, 2026-10-02)
Owner: Shwethan Potu
Lane: I — Integration
Sprint: STRETCH · planned D12–D13
Branch: `feature/shared-access-control-regression`
PR target: `main`
PR: https://github.com/MrThief123/care-compass/pull/209
Last updated: 2026-10-02 (PR opened)

## Blockers
- None. OQ-01 is ANSWERED (CHG-036: shared work branches from and PRs to `main`).

## Dependencies status
- FAM-15 — MERGED TO DEV
- CAR-06 — MERGED TO DEV
- ADM-07 — MERGED TO DEV

## Completed
- Claimed; tests written first (T-01 pgTAP, T-02 Vitest), run against the local Supabase stack, both AC-01 and AC-02 MET
- T-01 (`supabase/tests/access_control_regression.test.sql`): enumerates `pg_catalog` for every `public` table — no hand-maintained list, so a future table without RLS fails automatically. 16/16 tables currently pass; full pgTAP suite stays green (711 tests, 24 files)
- T-02 (`tests/integration/shared-access-control-regression.test.ts`): two parts —
  - Behavioural: signs in as each role via real Supabase auth (admin profiles complete TOTP enrolment first, OQ-08) and calls `evaluateRoleGuard` for each other role's dashboard; asserts the exact redirect destination (6 cases: 3 roles × 2 other dashboards)
  - Static route-coverage (no live stack needed): scans all 26 dashboard pages across the three role route groups and confirms each has a guarding ancestor layout calling `getCurrentUser`/`evaluateRoleGuard` for its role — catches a future page added without inheriting the guard
- `docs/security/PERMISSION_MATRIX.md` generated via new `scripts/generate-permission-matrix.mjs` (`npm run security:permission-matrix`) — queries RLS status from the live local Postgres container and cross-checks it against the same route scan as T-02. Currently: 16/16 tables RLS-enabled, 26/26 routes guarded.
- OWASP checks (input validation, no service-role key in client bundle, signed-URL expiry) already covered by F0-04/F0-21's `check:client-bundle-secrets` script and existing `documents.test.sql`/`shared-auth-security-audit.test.ts` — not duplicated here (PRD Scope line, no AC of its own)
- Local dev environment stood up to run this for real: Node v24.21.0 (LTS), Docker Desktop, local Supabase stack (`supabase start`, migrations + seed applied), `.env.local` populated

## In progress
- None

## Remaining
- None for this feature's two ACs

## Acceptance criteria status
- 2 / 2 MET

## Tests
- Written: 2 / 2 (T-01 db, T-02 integration — T-02 contains 9 assertions: 6 behavioural + 3 static)
- Passing: 711/711 pgTAP (24 files) + 2649/2650 Vitest (`npm run verify`, 235 files)
- Failing: 0 of this feature's tests. `npm run verify` (lint + typecheck + format + full test suite): lint 0 errors (3 pre-existing warnings, unrelated files), typecheck clean, format clean, 1 pre-existing failure — `tests/integration/shared-dev-seed-data.test.ts` [F0-16][AC-01] (FD-01, below). A separate full Playwright e2e run also surfaced 17 pre-existing failures across CAR-04/06/07, FAM-08/09, INT-02/03 (document uploads, task-completion timing, shift journeys — none touch RLS or route guards). This branch changes zero `src/**` or migration files (`git status` shows only this feature's own docs + one `package.json` script line), so none of this is caused here; FD-01 covers all of it.

## Files changed
- `supabase/tests/access_control_regression.test.sql` (new)
- `tests/integration/shared-access-control-regression.test.ts` (new)
- `scripts/generate-permission-matrix.mjs` (new)
- `docs/security/PERMISSION_MATRIX.md` (new, generated)
- `package.json` (new `security:permission-matrix` script)

## Decisions
- See DECISIONS.md — FD-01 recorded (pre-existing unrelated test failures, not fixed here)

## Problems encountered
- `evaluateRoleGuard` for an admin actor initially redirected to `/mfa/enroll` instead of `/admin/home` in the behavioural matrix — correct production behaviour (OQ-08's MFA gate runs before the role-mismatch check), fixed by enrolling and verifying TOTP for the admin test profile first, same sequence as F0-07's AC-10 test.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- "Every dashboard route" (AC-02) is read as every route under the three role-guarded route groups (`(admin)`, `(carer)`, `(family)`); auth routes (`/sign-in`, `/mfa/*` etc.) and non-dashboard routes (`/dev-preview*`, `/api/*`) are out of scope — they're not a specific role's dashboard.

## Next action
- None — ready for PR.

## Ready for PR
- Yes
