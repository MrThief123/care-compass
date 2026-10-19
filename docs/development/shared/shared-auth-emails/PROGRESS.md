# Progress — F0-24 Auth emails: working reset and invite links, set-password page

Owner: MrThief123
Status: MERGED TO DEV (merged to `main` in #218, 2026-10-03). Hosted SMTP and template set-up (AC-07) is a human step, tracked in DECISIONS.md
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
- Waiting on the human for the hosted set-up (AC-07).

## Remaining
- Human: set up custom SMTP, paste the two templates in the Supabase dashboard (not `supabase config push`, DECISIONS.md FD-07), and tick the hosted checklist in DECISIONS.md (AC-07).
- Refresh `care-compass-status.html` (`node scripts/status-page.mjs`), then ask the human for approval to open the PR.

## Acceptance criteria status
- 6 / 7 MET (AC-01 to AC-06). AC-07 needs the human to tick the hosted checklist.

## Tests
- Unit/component: new files all green; `tsc --noEmit` clean; eslint clean on touched files.
- Integration `tests/integration/auth-emails.test.ts`: 7 / 7 pass on the local stack (real emails read from the local mail catcher).
- E2E `tests/e2e/auth-emails.spec.ts`: 2 / 2 pass (production build, local stack, port 3100).
- Regression on the local stack: `auth.spec.ts`, `sign-up.spec.ts`, `auth-hardening.spec.ts`, `admin-mfa.spec.ts`, `admin-staff-panel.spec.ts` pass; `supabase test db` PASS (920 tests) after `supabase migration up --local` (the local database was 13 migrations behind; the first ADM-08 e2e failure and a shifts SQL failure were that, not this feature).
- Not caused by this feature, seen in the full runs: `tests/integration/shared-dev-seed-data.test.ts` (4; the local database has no seed data loaded) and `admin-edit-shift.test.ts` (2; date-dependent); and 197 failing unit tests in 14 files (family task/budget/home, admin-manage; `cookies` called outside a request scope), 48 of which were re-run on a clean tree and fail the same way. Not investigated.
- A bug found by the e2e run and fixed test-first: FD-09 above.
