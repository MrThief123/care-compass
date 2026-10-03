# Session State — INT-09 Overdue and upcoming care alert emails

Last session date: 2026-10-03
Current branch: `feature/shared-care-alert-emails` (cut from `docs/oq-40-answered`)
Exact next action: merge the latest `origin/main`, re-run the suites, refresh `care-compass-status.html` (`node scripts/status-page.mjs`), then ask the human for approval to open the PR (target `main`). The docs PR `docs/oq-40-answered` should merge first.
Files touched: migration `20261003113636_care_overdue_alert_notifications.sql`, `src/server/jobs/care-overdue-alerts{,-logic}.ts`, `src/app/api/jobs/care-overdue-alerts/route.ts`, `vercel.json`, `src/lib/supabase/database.types.ts`, `.env.example`, `docs/security/PERMISSION_MATRIX.md`, tests, this folder's docs.
Warning: the job reads across clients under the service role in `src/server/jobs/**` only. Do not edit INT-01 or INT-11's job files. Never test against the hosted project.
