# Progress — F0-07 Sign-in, sign-out, password reset and role-based routing

Status: READY FOR PR
Owner: Prajeet
Lane: B — Backend
Sprint: SPRINT · planned D5
Branch: `feature/shared-authentication`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-22

## Blockers
- None — OQ-01, OQ-08 both ANSWERED (see DECISIONS.md)

## Dependencies status
- F0-06 — MERGED TO DEV
- F0-15 — MERGED TO DEV
- UI-02 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- `/sign-in` (email + password, generic error, `?reason=` notices for AC-06/expired reset link, "Forgot password?" link)
- `/forgot-password` and `/reset-password` pages; `/auth/confirm` Route Handler exchanges the emailed OTP for a recovery session
- `src/server/auth/actions.ts`: `signIn`, `signOut`, `requestPasswordReset`, `resetPassword`, `enrollMfaFactor`, `verifyMfaCode` (Zod-validated Server Actions, `ActionResult` shape)
- `src/server/auth/routing.ts` / `guard.ts`: `resolveRoleHomePath`, `resolveMfaGatePath`, `evaluateRoleGuard` — the role-group guard, factored out of `redirect()` so it's directly testable
- `src/server/auth/queries.ts`: `getCurrentUser(role)`'s `supabase` branch now resolves the real session and applies the guard (mock branch unchanged, still used by Phase 1 screens); `getPrimaryTotpFactorId()`
- Route-group guards: unauthenticated (AC-05), wrong role (AC-04), deactivated profile (AC-06), unmet admin MFA (AC-09/AC-10) all redirect from `getCurrentUser(role)` — no changes needed to the three layout files beyond the sign-out button
- Sign-out: `<SignOutButton />` (new, `src/components/shared/sign-out-button.tsx`) wired into all three dashboard layouts via `PageHeader`'s new `signOutSlot` prop
- `/mfa/enroll` and `/mfa/verify` (CHG-001 — see DECISIONS.md): TOTP enrollment forced on an admin's first sign-in, AAL2 challenge on every sign-in after
- `/no-client-linked`: neutral page for a family account not yet linked to a client (PRD.md Error/Edge Cases)
- `supabase/config.toml`: enabled `auth.mfa.totp` locally (was disabled by default)
- `Field` kit component: added `type="password"` (was missing; sign-in/reset forms need masked input)
- `src/lib/supabase/server.ts`: parameterised `createServerClient` with the generated `Database` type (was untyped)

## In progress
- None

## Remaining
- None against this feature's ACs.

## Acceptance criteria status
- 10 / 10 MET (AC-09/AC-10 added by CHG-001 — see DECISIONS.md)

## Tests
- Written: 10 / 10 (T-01..T-10)
- Passing: 10
- Failing: 0

## Suite results
- `npm run test` (vitest, unit + integration): PASS — 429/429 tests, 61/61 files (`tests/integration/shared-authentication.test.ts` requires local Supabase; ran against it, not skipped)
- `supabase test db`: PASS (8/8, unchanged from F0-06 — no schema change in this feature)
- `npm run test:e2e -- tests/e2e/auth.spec.ts`: PASS (2/2 — T-01, T-03)
- `npm run lint`, `npm run typecheck`, `npm run format:check`: all clean (pre-existing warnings in `scripts/plan-status.mjs` and `src/app/page.tsx` are unrelated and untouched)

## Files changed
- New: `src/app/(auth)/layout.tsx`, `src/app/(auth)/sign-in/{page,sign-in-form}.tsx`, `src/app/(auth)/forgot-password/{page,forgot-password-form}.tsx`, `src/app/(auth)/reset-password/{page,reset-password-form}.tsx`, `src/app/(auth)/auth/confirm/route.ts`, `src/app/(auth)/mfa/enroll/{page,mfa-enroll-form}.tsx`, `src/app/(auth)/mfa/verify/{page,mfa-verify-form}.tsx`, `src/app/no-client-linked/page.tsx`, `src/server/auth/{actions,routing,guard}.ts`, `src/components/shared/sign-out-button.tsx`, `tests/integration/shared-authentication.test.ts`, `tests/e2e/auth.spec.ts`
- Modified: `src/server/auth/queries.ts`, `src/components/shared/page-header.tsx` (+ `.test.tsx` untouched, still passes), `src/components/shared/forms/field.tsx`, `src/components/ui/icon.tsx`, `src/lib/supabase/server.ts`, `src/app/(admin)/admin/layout.tsx`, `src/app/(carer)/carer/layout.tsx`, `src/app/(family)/family/[clientId]/layout.tsx`, `src/app/api/test/route.ts` (fixed a pre-existing broken query surfaced by the new `Database` typing — see Problems encountered), `supabase/config.toml`

## Decisions
- See DECISIONS.md (CHG-001: MFA implemented in this feature, not deferred)

## Problems encountered
- Adding the `Database` generic to `src/lib/supabase/server.ts`'s client surfaced a pre-existing type error in `src/app/api/test/route.ts` (an F0-04 dev-check route querying a nonexistent `"test"` table, previously untyped and silently broken at runtime too). Fixed by pointing it at `organisations` instead of deleting it, since `src/app/dev-preview-database` depends on it.
- `supabase/config.toml` had `auth.mfa.totp` disabled by default; enabled it locally for CHG-001 (OQ-08 admin MFA) and restarted the stack.
- `@supabase/auth-js`'s `listFactors()` "totp" convenience array is typed (and behaves) as verified-only, unlike `all`; the MFA gate initially got this wrong for the zero-factor case (AAL never differs when nothing's enrolled) — first test run against local Supabase caught it and it's fixed in `resolveMfaGatePath`.
- Under the default `DATA_SOURCE=mock`, a real signed-in family user landing on `/family/<real client id>/home` hits `getClientHeaderSummary`'s mock lookup, which doesn't recognise a real Supabase-generated UUID, and errors. AC-01 only asserts the destination URL (which is reached), so T-01 passes, but the page itself won't render correctly until each domain's own Phase 3 wiring feature lands — this is the expected transitional state per the incremental `DATA_SOURCE` rollout (ARCHITECTURE.md §3.2), not a defect in this feature.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- Sign-in/sign-out/password-reset Server Actions always call real Supabase Auth regardless of `DATA_SOURCE` — there's no meaningful "mock sign-in" concept (Phase 1 screens already pick a role via `?as=`); only `getCurrentUser`'s guard behaviour is mode-gated, matching every other domain's contract-function pattern.

## Next action
- Human: review and, if approved, open the PR to `main` (OQ-01, shared work).
- Once merged: F0-08, F0-10, ADM-02, FAM-12, CAR-09, ADM-10 unblock (all depend on F0-07 among not-yet-started features).

## Ready for PR
- Yes
