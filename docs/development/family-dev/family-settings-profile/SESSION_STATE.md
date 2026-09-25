# Session State — FAM-12 Family — Settings: family info and password reset

Last session date: 2026-09-25
Current branch: `feature/family-settings-profile` (from `origin/family-dev`)
Worked on: tests first, migration, server actions and contract, view wiring, verification, docs.
Tests run: pgTAP (40), FAM-12 unit/component (71 in 5 files), FAM-12 integration against the local stack (4), typecheck, lint, prettier, `next build`, real-browser run on the mock data source.
Test results: all green except the pre-existing `day-timeline` failure and the F0-07 AC-10 TOTP test on the stale local stack (both unrelated).
Current blocker: none. Waiting for the human's review and approval to open the PR.
Important discoveries: `.env.local` points at a hosted Supabase project, so integration tests run against it unless overridden (see PROGRESS, Problems). The migration is applied locally only. `getClientHeaderSummary` has no Supabase branch, so the page cannot render on the database yet. The PR must flag: `supabase/**` edited from Lane F (FD-01), two test levels differ (FD-05), two FAM-UI-06 tests changed (FD-06), proposed failure wording (FD-07).
Exact next action: on the human's "yes", open the PR `FAM-12 Family — Settings: family info and password reset` to `family-dev` using `docs/DEVELOPMENT_WORKFLOW.md` §8. FAM-13 (`feature/family-change-organisation`) is claimed and waits on FAM-12 merging.
