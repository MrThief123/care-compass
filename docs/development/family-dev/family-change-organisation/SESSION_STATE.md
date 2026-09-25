# Session State — FAM-13 Family — Change organisation

Last session date: 2026-09-25
Current branch: `feature/family-change-organisation` (from `origin/family-dev`, which contains FAM-12)
Worked on: tests first, migration, server action and contract, picker and view, verification, docs.
Tests run: pgTAP (66), FAM-13 unit/component (80 in 5 files), FAM-13 and FAM-12 integration against the local stack (7), typecheck, lint, prettier, `next build`, full `npm run test`, real-browser run on the mock data source.
Test results: all green.
Current blocker: none. Waiting for the human's review and approval to open the PR.
Important discoveries: `.env.local` points at a hosted Supabase project, so integration tests run there unless overridden, and the FAM-13 migration is applied locally only. AC-03 can only be proven for the tables that exist today (FD-05). The PR must flag: `supabase/**` edited from Lane F (FD-01), Lane S files edited (`src/mocks`, `database.types.ts`, FD-01, FD-06), FAM-UI-06 test helpers changed (FD-07), the undesigned picker and wording (FD-02, FD-08).
Exact next action: on the human's "yes", open the PR `FAM-13 Family — Change organisation` to `family-dev` using `docs/DEVELOPMENT_WORKFLOW.md` §8.
