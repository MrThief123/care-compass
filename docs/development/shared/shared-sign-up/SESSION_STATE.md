# Session State — F0-17 Self-serve sign-up for Family and Organisation accounts

Last session date: 2026-09-27
Current branch: `feature/shared-sign-up` (from `main`; claimed and pushed)
Worked on: claim, tests first (red), migration with `register_account()` and `discard_unregistered_account()`, shared Zod schema
What changed: `supabase/migrations/20260927010000_sign_up.sql`; `supabase/tests/sign_up.test.sql`; `tests/integration/shared-sign-up.test.ts`; `tests/e2e/sign-up.spec.ts`; `src/server/auth/sign-up-schema.ts`; feature docs
Tests run: `supabase test db` (whole suite); `vitest run tests/integration/shared-sign-up.test.ts` (red)
Test results: pgTAP PASS (`sign_up.test.sql` 42 assertions, T-05 and T-07). Integration T-02/T-03/T-04/T-06 FAIL as expected (`signUp` is not exported). e2e T-01/T-08 not run yet (needs `npm run build`).
Current blocker: none
Important discoveries: admin TOTP MFA is live on `main` (F0-07 CHG-001) although PD-040 says no mandatory MFA. CHG-010 decided MFA stays not mandatory; its removal is a separate shared follow-up fix. Until that lands a new admin hits MFA enrolment after sign-up.
Important decisions: PD-057, CHG-010; feature FD-01 to FD-08 (DECISIONS.md)
Exact next action: add `signUp(input)` to `src/server/auth/actions.ts` (parse with `SignUpInputSchema`; `supabase.auth.signUp`; map an existing email to `EMAIL_EXISTS`; call the `register_account` RPC; on failure call `discard_unregistered_account` then sign out; return `redirectTo` via `resolvePostSignInPath`), extend `AuthActionResult` with `fieldErrors` and the new codes; then build `src/app/(auth)/sign-up/` and the sign-in link. Before relying on `SignUpInputSchema`, check that the password-mismatch refinement still reports alongside other field errors (Zod 4 skips a refinement when the object already has issues); if it does not, move the check into a `superRefine` or into the form.
Files likely to be touched next: `src/server/auth/actions.ts`, `src/server/auth/sign-up-schema.ts`, `src/app/(auth)/sign-up/`, `src/app/(auth)/sign-in/sign-in-form.tsx` (link only), tests as needed (record any change in DECISIONS.md)
Warning for next session: never let public sign-up create a `carer` or attach to an existing organisation/client; keep `/sign-in` behaviour unchanged apart from the new link. Do not edit ARCHITECTURE.md (controlled; FD-08). Do not regenerate `database.types.ts` (FD-06). Run `npx supabase migration up --local` after pulling any new migration, then `supabase test db`.
