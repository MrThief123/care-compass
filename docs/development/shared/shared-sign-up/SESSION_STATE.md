# Session State — F0-17 Self-serve sign-up for Family and Organisation accounts

Last session date: 2026-09-24
Current branch: none yet (docs added on `docs/chg-010-self-serve-sign-up`)
Worked on: feature planned by CHG-010 (PD-057)
What changed: feature docs created
Tests run: none
Test results: none
Current blocker: none
Important discoveries: admin TOTP MFA is live on `main` (F0-07 CHG-001) although PD-040 says no mandatory MFA — CHG-010 risk 1; a new admin will hit MFA enrolment straight after sign-up.
Important decisions: PD-057, CHG-010
Exact next action: START FEATURE F0-17
Files likely to be touched next: `src/app/(auth)/sign-up/`, `src/app/(auth)/sign-in/sign-in-form.tsx` (link only), `src/server/auth/actions.ts`, `supabase/migrations/`, `supabase/tests/`, `tests/integration/shared-sign-up.test.ts`, `tests/e2e/sign-up.spec.ts`
Warning for next session: never let public sign-up create a `carer` or attach to an existing organisation/client; keep `/sign-in` behaviour unchanged apart from the new link.
