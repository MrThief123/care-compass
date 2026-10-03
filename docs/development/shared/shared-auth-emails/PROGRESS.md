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
- None

## Remaining
- Implementation: templates + config, confirm route (`code`), `/set-password`, `setPassword` action, `resendStaffInvite` + button, hosted checklist update.

## Acceptance criteria status
- 0 / 7 MET

## Tests
- Written: 6 / 7 (T-07 is review)
- Unit/component tests run and FAIL for the expected reason (feature not built): confirm route ignores `code` and `type=invite`; `setPassword`, `resendStaffInvite` and `/set-password` form do not exist; no Resend invite button. 22 failing, 0 unexpected.
- Integration (`tests/integration/auth-emails.test.ts`) and e2e (`tests/e2e/auth-emails.spec.ts`) written but NOT run: Docker/local Supabase and Mailpit are not available in this session (`docker info` hangs). Must be run before the PR.
