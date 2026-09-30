# Progress — F0-17 Self-serve sign-up for Family and Organisation accounts

Status: MERGED TO DEV
Owner: MrThief123
Lane: B — Backend
Branch: `feature/shared-sign-up`
PR target: `main` (merged in #129, 2026-09-27; CHG-036)
Last updated: 2026-09-30

## Blockers
- None — OQ-01, OQ-07, OQ-08 ANSWERED

## Dependencies status
- F0-06 — MERGED TO DEV
- F0-07 — MERGED TO DEV

## Completed
- Feature documentation drafted (CHG-010, 2026-09-24)
- Claimed on `feature/shared-sign-up` (2026-09-27)
- Tests written first and run red (T-01 to T-08, plus extra PRD tests)
- Migration `20260927010000_sign_up.sql`: `register_account()` and `discard_unregistered_account()`
- `signUp` Server Action, `src/server/auth/registration.ts` (RPC wrapper, FD-06), shared schema `src/server/auth/sign-up-schema.ts`
- `/sign-up` page and form, the 'Create an account' link on `/sign-in`, and the signed-in redirect

## In progress
- None

## Remaining
- Human review of FD-01 and FD-08; then push and open the PR to `main` (only with the human's approval)

## Acceptance criteria status
- 8 / 8 MET

## Tests
- Written: 8 / 8 (T-01 to T-08), plus extra PRD tests (signed-in redirect, no direct inserts into tenancy tables, discard of a half-made account, blank-name and second-registration rejection)
- Passing (2026-09-27): all of them. pgTAP `sign_up.test.sql` (42 assertions; whole `supabase test db` PASS); integration `shared-sign-up.test.ts` 4 / 4; e2e `sign-up.spec.ts` 7 / 7 and F0-07's `auth.spec.ts` 2 / 2 (run against a build)
- Failing: none of F0-17's. Whole Vitest suite: 1930 passed, 1 failed: `[F0-07][AC-10]` TOTP in `tests/integration/shared-authentication.test.ts`. It fails identically on a clean checkout with F0-17's changes stashed: the running local Supabase container answers 'MFA enroll is disabled' although `supabase/config.toml` has `enroll_enabled = true` (a stale container; `supabase stop && supabase start` should fix it). Not caused by this feature.
- Lint: 0 errors; 3 warnings, all in files this feature does not touch (`scripts/plan-status.mjs`, `src/app/page.tsx`)

## Files changed
- Tests: `supabase/tests/sign_up.test.sql`, `tests/integration/shared-sign-up.test.ts`, `tests/e2e/sign-up.spec.ts`
- Migration: `supabase/migrations/20260927010000_sign_up.sql`
- Code: `src/server/auth/sign-up-schema.ts`, `src/server/auth/registration.ts` (new); `src/server/auth/actions.ts` (`signUp`, extended `AuthActionResult`); `src/app/(auth)/sign-up/page.tsx`, `sign-up-form.tsx` (new); `src/app/(auth)/sign-in/sign-in-form.tsx` (link only)
- Docs: this folder

## Decisions
- PD-057, CHG-010 (root DECISIONS.md)
- See DECISIONS.md (FD-01 to FD-08). FD-01 (how a half-made account is cleaned up) and FD-08 (an ARCHITECTURE.md line that needs a controlled change) want human confirmation.

## Problems encountered
- The service-role client is limited to `src/server/jobs/**` (ADR-02), so the sign-up action cannot delete a half-made auth user itself. Solved in the database with `discard_unregistered_account()` (FD-01).
- `src/lib/supabase/database.types.ts` does not know the new functions. Regenerating it is the same problem F0-12 recorded (its FD-04: about 1,500 changed lines, and `src/app/api/test/route.ts` then fails typecheck). Not regenerated here; the action calls the RPC through a narrow typed wrapper (FD-06).
- **CI's `unit` job failed on the first push of the implementation** (AC-02, AC-06): it runs `npm test` with repository secrets for a hosted Supabase project that does not have this migration. Fixed by gating the tests on a local URL, the repo's convention (FD-07). CI now skips them; `db-test` (pgTAP) and the page-only e2e tests are what CI runs for this feature.
- **`.env.local` points at a hosted Supabase project** (`https://<ref>.supabase.co`), not the local stack that the integration and e2e tests are documented to need. Against it, `signUp` fails (the hosted project lacks this migration), and every integration test in the repo reads and writes that project. Nothing of F0-17's was left behind there (checked read-only: 0 users, 0 test organisations or clients). I ran the F0-17 tests against the local stack by exporting the three variables from `npx supabase status -o env` for the command, and did not edit `.env.local`. The owner should decide which project `.env.local` should point at, and apply this migration to the hosted project (`supabase db push`, or the dashboard SQL editor) after the PR merges; until then sign-up will not work against it.
- A new admin is still sent to `/mfa/enroll` after sign-up: forced admin TOTP enrolment is live from F0-07 and its removal is a separate shared follow-up (CHG-010 risk 1). AC-02 only requires the same routing as an existing admin.

## Assumptions
- PROPOSED copy in PRD.md is unconfirmed until reviewed in the PR.
- Password minimum is 6 characters, matching `minimum_password_length` in `supabase/config.toml` (PRD: "Supabase's minimum").

## Next action
- Human reviews FD-01 and FD-08; on approval, push and open the PR to `main`.

## Ready for PR
- Not yet: READY FOR PR once the human has reviewed FD-01 and FD-08. Definition of Done met except that `npm run verify`'s test step has one failure that is not this feature's (see Tests). PR not opened: needs the human's approval (CLAUDE.md §8).
