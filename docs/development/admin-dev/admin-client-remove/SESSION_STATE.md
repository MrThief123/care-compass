# Session State — ADM-05 Admin — Remove client

Last session date: 2026-10-03
Current branch: `feature/admin-client-remove` (worktree `../care-compass-adm-05`, from `main` at 53b4eb5)
Worked on: START — docs, decisions, tests first. No production code.
What changed: docs in this folder; six new test files (listed in PROGRESS.md).
Tests run: the four Vitest files, the integration file against local Supabase, and the pgTAP file.
Test results: all fail for the expected reasons (no `admin_remove_client`, no `organisation_removed_at`, no `clients-actions`, no banners).
Current blocker: none.
Important discoveries: a family sign-up creates a client with no organisation, so null organisation alone is not "removed" (FD-03); FAM-13 hides Change when there is no organisation, so a removed family needs the new Choose organisation button (FD-04).
Important decisions: FD-01 to FD-06. Shifts: cancel future, end running (FD-02). No notification system, banner only (FD-04, human).
Exact next action: run `node scripts/plan-status.mjs`, merge `origin/main`, then implement in this order: migration → `database.types.ts` → pgTAP green → `clients-actions.ts` + mock store → Admin screen → header summary → Settings → Home → the two Family pages.
Files likely to be touched next: `supabase/migrations/<new>_admin_remove_client.sql`, `src/server/admin/clients-actions.ts`, `src/server/admin/clients-mock-store.ts`, `src/server/admin/clients-queries.ts`, `src/features/admin-clients/clients-screen.tsx`, `src/server/clients/queries.ts`, `src/features/family-settings/family-settings-view.tsx`, `src/features/family-home/family-home-view.tsx`, `src/app/(family)/family/[clientId]/{home,settings}/page.tsx`.
Warning for next session: use `supabase migration new`; never edit an existing migration. Do not touch `transfer_client_organisation`. Do not add any notification. Run Next with `--webpack` in a worktree whose `node_modules` is a symlink. Do not open the PR without the human's yes.
