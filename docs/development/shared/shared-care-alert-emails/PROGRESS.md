# Progress — INT-09 Overdue and upcoming care alert emails

Owner: MrThief123
Status: IN PROGRESS
Jira: —
Branch: `feature/shared-care-alert-emails`
PR target: `main`
Last updated: 2026-10-03

## Blockers
- None. OQ-40 ANSWERED 2026-10-03 (PD-062). The docs PR `docs/oq-40-answered` (decision record, rewritten docs) should merge first; this branch is cut from it.

## Dependencies status
- INT-01 — MERGED
- F0-11 — MERGED
- F0-24 — MERGED (hosted SMTP and Resend set-up is a human step, F0-24 AC-07)

## Completed
- OQ-40 recorded (PD-062); PRD, ACs, test plan, stories and feature decisions rewritten.

## In progress
- Claimed; tests first.

## Remaining
- Tests (T-01 to T-09), migration, job, route, cron entry, `.env.example` check, docs.

## Acceptance criteria status
- 0 / 8 MET

## Tests
- Written: 9 / 9 (T-01 to T-09) across pgTAP (`supabase/tests/care_overdue_alert_notifications.test.sql`), unit (`src/server/jobs/care-overdue-alerts-logic.test.ts`, `src/app/api/jobs/care-overdue-alerts/route.test.ts`) and integration (`tests/integration/care-overdue-alerts.test.ts`).
- Confirmed failing for the expected reason (feature not built): the job, logic and route modules do not resolve; the pgTAP table does not exist (10/10 fail).
- Passing: 0
