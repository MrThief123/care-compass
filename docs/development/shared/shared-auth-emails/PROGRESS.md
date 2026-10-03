# Progress — F0-24 Auth emails: working reset and invite links, set-password page

Owner: MrThief123
Status: IN PROGRESS
Jira: —
Branch: `feature/shared-auth-emails`
PR target: `main`
Last updated: 2026-10-03

## Blockers
- None. Hosted email set-up (custom SMTP, sender domain) is a human step needed before AC-07, not before the code.

## Dependencies status
- F0-07, F0-17, ADM-02 — MERGED

## Completed
- Feature documentation drafted (CHG-047).

## In progress
- Waiting on a local Supabase stack to run the integration and e2e tests (see Tests).

## Remaining
- Start Docker and `supabase start`, run `tests/integration/auth-emails.test.ts` and `tests/e2e/auth-emails.spec.ts`, plus the regression specs; record results. Then mark AC-01 to AC-06 MET.
- Human: set up custom SMTP, paste the two templates in the Supabase dashboard (not `supabase config push`, DECISIONS.md FD-07), and tick the hosted checklist in DECISIONS.md (AC-07).
- Refresh `care-compass-status.html` (`node scripts/status-page.mjs`) and open the PR once the above is green and the human approves.

## Acceptance criteria status
- 0 / 7 MET. Implemented, unit/component-verified: AC-01 (route), AC-02, AC-03 (action and form), AC-05 (action and button), AC-06. NOT verified end to end: needs the local stack. AC-04 is Supabase's own refusal, covered only by the integration test. AC-07 needs the human.

## Tests
- Unit/component: 6 new test files, all green (182 tests across `src/app/(auth)`, `src/server/auth`, `src/server/admin`, `src/features/admin-staff`); `tsc --noEmit` clean; eslint clean on touched files.
- Written first and confirmed failing for the right reason (22 failures before implementation).
- Integration `tests/integration/auth-emails.test.ts` and e2e `tests/e2e/auth-emails.spec.ts`: written, NOT RUN (no Docker in the session that wrote them).
- Full `vitest run` on this branch: 197 failures in 14 files this feature does not touch (family task/budget/home, admin-manage). Two of them were re-run on a clean tree and fail the same way (`cookies` was called outside a request scope), so pre-existing; not investigated here.
