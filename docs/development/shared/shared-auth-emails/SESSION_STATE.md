# Session State — F0-24 Auth emails: working reset and invite links, set-password page

Last session date: 2026-10-03
Current branch: `feature/shared-auth-emails`
Exact next action: human does the hosted set-up (SMTP, paste templates, site URL and redirects, real reset + invite to an outside address) and ticks the checklist in DECISIONS.md; then run `node scripts/status-page.mjs`, check the page in a browser, merge the latest `origin/main`, re-run the suites, and ask the human for approval to open the PR.
Files touched: `supabase/templates/*`, `supabase/config.toml`, `src/app/(auth)/auth/confirm/route.ts`, `src/app/(auth)/set-password/*`, `src/server/auth/actions.ts`, `src/server/jobs/admin-invite-staff.ts`, `src/server/admin/staff-actions.ts`, `src/features/admin-staff/staff-screen.tsx`, `.env.example`, tests, this folder's docs.
Warning: edits `src/server/admin/**` (ADM-02's contract file) for resend invite; ADM-11 (in progress) also touched `src/server/admin/**`; check before the PR. Never test against the hosted project.
