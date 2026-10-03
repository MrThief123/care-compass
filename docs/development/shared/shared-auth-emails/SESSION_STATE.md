# Session State — F0-24 Auth emails: working reset and invite links, set-password page

Last session date: 2026-10-03
Current branch: `feature/shared-auth-emails`
Exact next action: start Docker + `supabase start` (apply migrations; the templates in `supabase/config.toml` need a restart to load), put the stack's URL/keys in the env, run `npx vitest run tests/integration/auth-emails.test.ts` and the e2e spec per the comment at the top of `tests/e2e/auth-emails.spec.ts`, fix anything they show, then the regression specs. Then human ticks the hosted checklist; refresh the status page; ask the human for approval to open the PR.
Files touched: `supabase/templates/*`, `supabase/config.toml`, `src/app/(auth)/auth/confirm/route.ts`, `src/app/(auth)/set-password/*`, `src/server/auth/actions.ts`, `src/server/jobs/admin-invite-staff.ts`, `src/server/admin/staff-actions.ts`, `src/features/admin-staff/staff-screen.tsx`, `.env.example`, tests, this folder's docs.
Warning: edits `src/server/admin/**` (ADM-02's contract file) for resend invite; ADM-11 (in progress) also touched `src/server/admin/**`; check before the PR. Never test against the hosted project.
