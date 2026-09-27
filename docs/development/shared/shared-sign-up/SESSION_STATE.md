# Session State — F0-17 Self-serve sign-up for Family and Organisation accounts

Last session date: 2026-09-27
Current branch: `feature/shared-sign-up` (from `main`; claimed and pushed)
Worked on: everything: tests first, migration, `signUp` action, `/sign-up` page and form, sign-in link, docs
What changed: see PROGRESS.md "Files changed"
Tests run: `supabase test db`; full Vitest; `npm run build` then Playwright `sign-up.spec.ts` and `auth.spec.ts`; eslint, tsc, prettier
Test results: all F0-17 tests pass (pgTAP 42 assertions, integration 4/4, e2e 7/7 plus F0-07 regression 2/2). One unrelated failure: F0-07 AC-10 TOTP (stale local container, fails identically without F0-17's changes).
Current blocker: none
Important discoveries: admin TOTP MFA is live on `main` (F0-07 CHG-001) although PD-040 says no mandatory MFA. CHG-010 decided MFA stays not mandatory; its removal is a separate shared follow-up fix. Until that lands a new admin hits MFA enrolment after sign-up.
Also discovered: `.env.local` points at a hosted Supabase project, not the local stack (PROGRESS.md, Problems). Run integration and e2e tests with the three Supabase variables exported from `npx supabase status -o env`.
Important decisions: PD-057, CHG-010; feature FD-01 to FD-08 (DECISIONS.md). FD-01 and FD-08 need the human.
Exact next action: human reviews FD-01 and FD-08; on approval, push the branch (already pushed up to the docs commit) and open the PR to `main`. After merge, apply `20260927010000_sign_up.sql` to any shared Supabase project.
Files likely to be touched next: none, unless review asks for changes.
Warning for next session: never let public sign-up create a `carer` or attach to an existing organisation/client; keep `/sign-in` behaviour unchanged apart from the new link. Do not edit ARCHITECTURE.md (controlled; FD-08). Do not regenerate `database.types.ts` (FD-06). After pulling any new migration run `npx supabase migration up --local`, then `supabase test db`.
