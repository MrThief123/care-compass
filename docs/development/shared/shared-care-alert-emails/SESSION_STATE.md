# Session State — INT-09 Overdue and upcoming care alert emails

Last session date: 2026-10-03
Current branch: `feature/shared-care-alert-emails` (cut from `docs/oq-40-answered`)
Exact next action: write T-01 to T-09 first (pgTAP, unit, integration), confirm they fail for the right reason, commit `test(shared): …`; then migration (`supabase migration new`), job `src/server/jobs/care-overdue-alerts.ts`, route `src/app/api/jobs/care-overdue-alerts/route.ts`, `vercel.json` entry.
Files touched: docs only.
Warning: reuse `buildOccurrences` (pure) with service-role rows; do not edit INT-01 or INT-11 job files. Never test against the hosted project.
