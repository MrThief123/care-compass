# Progress — F0-20 Admin TOTP MFA hardening

Owner: Dhruv Verma
Status: READY FOR PR
Jira: —
Branch: `feature/shared-admin-mfa-hardening`
PR target: `main`
Last updated: 2026-10-01

## Blockers
- None

## Dependencies status
- F0-07 Authentication — merged to `main`

## Completed
- QR code shows in a real browser (AC-01)
- Enrolment runs once from the client, so concurrent renders no longer race (AC-02, AC-04)
- Unique `friendlyName` per enrolment; stale unverified factors (older than 5 minutes) cleaned, verified ones never touched (AC-02, AC-03)
- Code field cleared and focused after a wrong code, error has `role="alert"` (AC-05)
- Clear messages for wrong, expired and missing-factor codes; nothing throws (AC-06)
- Full enrol, sign out, sign in, verify path works in a browser (AC-07)
- Gate unchanged: admin aal1 redirected to verify, family and carer never gated (AC-08)
- No credentials, codes or secrets logged by our auth code (AC-09)
- Separate feature F0-21 Auth security audit added to the plan (CHG-041)

## In progress
- None

## Remaining
- Human approval, then open the PR

## Acceptance criteria status
- 9 / 9 MET
- Note: the plan card in `DEVELOPMENT_PLAN.md` says 10 ACs; `ACCEPTANCE_CRITERIA.md` has 9. Totals may be off by one.

## Tests
- Written: 15 / 15 (T-01 to T-15)
- Passing: 15
- Failing: 0
- Last run: 2026-10-01, local Supabase, CI down:
  - `npx vitest run "src/app/(auth)/mfa" src/server/auth/mfa-actions.test.ts` ×10 sequential: 22 passed each
  - `npx vitest run --exclude "tests/integration/**"`: 2233 passed (170 files)
  - `npx tsc --noEmit`: clean; `npx prettier --check .`: clean; `npm run lint`: 0 errors, 2 old warnings (dev-preview)
  - `DATA_SOURCE=supabase npm run build`, then `E2E_PORT=3210 E2E_DATA_SOURCE=supabase npx playwright test tests/e2e/admin-mfa.spec.ts`: 3 passed
  - `npx playwright test auth sign-up root-route admin-mfa` (same env): 17 passed
  - `npx vitest run tests/integration`: 133 passed, 3 failed, none F0-20. `family-home-budget-strip` T-02/T-03 fail on a UTC-vs-Melbourne month boundary in the FAM-03 fixture (not this feature); `shared-sign-up` AC-04 failed once under load and passed on rerun of its file. The 5 F0-20 integration tests passed.
- Tests-first evidence: `01fe492` (failing tests). Unit, component and integration were red for the expected reason. The e2e specs could not run red: a build of the old code fails typechecking on the missing `./mfa-enroll-flow` import.
- Flakiness: 10 of 10 consecutive runs each for unit and component (22), integration (5) and e2e (3). See TEST_PLAN.md.

## Files changed
- `src/server/auth/actions.ts` (unique name, 5-minute stale cleanup, missing-factor message)
- `src/app/(auth)/mfa/enroll/page.tsx`, `mfa-enroll-flow.tsx` (new), `mfa-enroll-form.tsx`
- `src/app/(auth)/mfa/verify/mfa-verify-form.tsx`
- `playwright.config.ts` (port and data source from env)
- Tests: `src/server/auth/mfa-actions.test.ts`, `src/app/(auth)/mfa/enroll/mfa-enroll.test.tsx`, `src/app/(auth)/mfa/verify/mfa-verify-form.test.tsx`, `tests/integration/shared-admin-mfa-hardening.test.ts`, `tests/e2e/admin-mfa.spec.ts`
- Helpers: `tests/helpers/totp.ts`, `tests/helpers/fake-mfa-supabase.ts`
- `tests/integration/shared-authentication.test.ts`: refactor only, imports `totpCode` from the new helper; no expectation changed
- Docs: this feature's docs; `DEVELOPMENT_PLAN.md` (F0-20 row and card, F0-21); `docs/development/shared/shared-auth-security-audit/` (new feature F0-21)

## Decisions
- FD-01 to FD-05 (see DECISIONS.md); root CHG-040 and CHG-041

## Problems encountered
- Focus assertions and the e2e alert locator were flaky/ambiguous in my own new tests; fixed (`waitFor`, `hasText "isn't right"`). No existing test changed.
- Unrelated FAM-03 budget integration tests fail across the UTC/Melbourne month boundary.

## Assumptions
- No HUMAN REVIEW flag needed: no existing test expectation changed.

## Next action
- Human says "yes", then open the PR to `main`.

## Ready for PR
- Yes, awaiting human approval
