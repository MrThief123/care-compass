# Session State — F0-24 Auth emails: working reset and invite links, set-password page

Last session date: 2026-10-03
Current branch: `feature/shared-auth-emails`
Exact next action: implement to turn the failing tests green: (1) `supabase/templates/{recovery,invite}.html` + `config.toml`; (2) `/auth/confirm` accepts `?code=`, validates `type`, defaults `next` to `/set-password` for invite; (3) `setPassword` action + `/set-password` page/form; (4) `resendStaffInviteEmail` in `src/server/jobs/admin-invite-staff.ts`, `resendStaffInvite` in `src/server/admin/staff-actions.ts`, button in `src/features/admin-staff/staff-screen.tsx`; (5) `.env.example`, hosted checklist. Then start Docker + `supabase start` and run the integration and e2e files.
Files touched: tests only (`*.email-links.test.ts`, `set-password*.test.ts`, `staff-resend-invite.test.ts`, `staff-screen.test.tsx`, `tests/helpers/mailpit.ts`, `tests/integration/auth-emails.test.ts`, `tests/e2e/auth-emails.spec.ts`) and this folder's docs.
Warning: edits `src/server/admin/**` (ADM-02's contract file) for resend invite; ADM-11 (in progress) also touched `src/server/admin/**`; check before the PR. Never test against the hosted project.
