# Progress — F0-17 Self-serve sign-up for Family and Organisation accounts

Status: IN PROGRESS
Owner: MrThief123
Lane: B — Backend
Branch: `feature/shared-sign-up`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-27 (database side done; action and page next)

## Blockers
- None — OQ-01, OQ-07, OQ-08 ANSWERED

## Dependencies status
- F0-06 — MERGED TO DEV
- F0-07 — MERGED TO DEV

## Completed
- Feature documentation drafted (CHG-010, 2026-09-24)
- Claimed on `feature/shared-sign-up` (2026-09-27)
- Tests written first and run red (T-01 to T-08, plus extra PRD tests); committed `test(auth): …`
- Database side (2026-09-27): migration `20260927010000_sign_up.sql` with `register_account()` and `discard_unregistered_account()`; `supabase test db` passes (`sign_up.test.sql`, 42 assertions)
- Shared Zod schema `src/server/auth/sign-up-schema.ts` written (not yet run against tests)

## In progress
- `signUp` Server Action in `src/server/auth/actions.ts` (FD-01, FD-04, FD-05)

## Remaining
- `signUp` action, then integration tests T-02, T-03, T-04, T-06 green
- `/sign-up` page and form under `src/app/(auth)/sign-up/`; 'Create an account' link on `/sign-in`; signed-in redirect (PRD Error / Edge Cases)
- e2e T-01, T-08 (and the redirect test) against a production build (`npm run build`), plus F0-07 regression (`auth.spec.ts`, `shared-authentication.test.ts`)
- `npm run verify` and `supabase test db` before READY FOR PR

## Acceptance criteria status
- 2 / 8 MET (AC-05, AC-07: database tests pass). AC-01 to AC-04, AC-06, AC-08 NOT MET until the action and page exist; the database rules they rest on are already covered by `sign_up.test.sql`.

## Tests
- Written: 8 / 8 (T-01 to T-08), plus extra PRD tests (signed-in redirect, no direct inserts into tenancy tables, discard of a half-made account, blank-name and second-registration rejection)
- Passing (2026-09-27): T-05 and T-07, in `supabase test db` (`sign_up.test.sql`: 42 assertions; whole suite PASS)
- Failing, for the expected reason: T-02, T-03, T-04, T-06 (`signUp` is not exported yet); T-01, T-08 and the redirect test (`/sign-up` not built; e2e not run yet, needs `npm run build`)

## Files changed
- Tests: `supabase/tests/sign_up.test.sql`, `tests/integration/shared-sign-up.test.ts`, `tests/e2e/sign-up.spec.ts`
- Migration: `supabase/migrations/20260927010000_sign_up.sql`
- Code: `src/server/auth/sign-up-schema.ts` (new); `src/server/auth/actions.ts`, `src/app/(auth)/sign-up/`, `src/app/(auth)/sign-in/sign-in-form.tsx` (link only) still to do
- Docs: this folder

## Decisions
- PD-057, CHG-010 (root DECISIONS.md)
- See DECISIONS.md (FD-01 to FD-08). FD-01 (how a half-made account is cleaned up) and FD-08 (an ARCHITECTURE.md line that needs a controlled change) want human confirmation.

## Problems encountered
- The service-role client is limited to `src/server/jobs/**` (ADR-02), so the sign-up action cannot delete a half-made auth user itself. Solved in the database with `discard_unregistered_account()` (FD-01).
- `src/lib/supabase/database.types.ts` does not know the new functions. Regenerating it is the same problem F0-12 recorded (its FD-04: about 1,500 changed lines, and `src/app/api/test/route.ts` then fails typecheck). Not regenerated here; the action calls the RPC through a narrow typed wrapper (FD-06).
- A new admin is still sent to `/mfa/enroll` after sign-up: forced admin TOTP enrolment is live from F0-07 and its removal is a separate shared follow-up (CHG-010 risk 1). AC-02 only requires the same routing as an existing admin.

## Assumptions
- PROPOSED copy in PRD.md is unconfirmed until reviewed in the PR.
- Password minimum is 6 characters, matching `minimum_password_length` in `supabase/config.toml` (PRD: "Supabase's minimum").

## Next action
- Implement the `signUp` action (see SESSION_STATE.md "Exact next action"), then the page and link; run T-01 to T-08 until green.

## Ready for PR
- No
