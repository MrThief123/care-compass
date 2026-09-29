# Session State — ADM-01 Admin Home — counts and overdue events

Last session date: 2026-09-29
Current branch: `feature/admin-home`
Worked on: claimed ADM-01, recorded CHG-034 (Upcoming shifts brought into scope, human in-session),
  wired `getAdminHome()` to Supabase (counts, overdue derivation, upcoming shifts), wrote and ran its
  tests, updated all feature docs.
What changed: `src/server/admin/queries.ts` (Supabase branch); `src/server/admin/queries.test.ts`
  (removed its now-false not-implemented test, FD-01); `tests/integration/admin-home.test.ts` (new);
  root `DECISIONS.md` (CHG-034); all six feature docs updated.
Tests run: `npx vitest run` (full suite), `npx vitest run tests/integration/admin-home.test.ts` against
  local Supabase (env vars overridden inline, `.env.local` here points at a hosted project),
  `npx playwright test tests/e2e/smoke.spec.ts`, `npm run lint`, `npm run typecheck`,
  `npm run format:check`
Test results: all green — 2047 passed/59 skipped (pre-existing) full unit run; 4/4 new integration;
  smoke e2e passes; lint 0 errors (2 pre-existing warnings in `src/app/page.tsx`, not touched);
  typecheck and format clean
Current blocker: none
Important discoveries: ADM-UI-01 already built the route, stat cards, Overdue card and empty state
  against mock data — nothing to rebuild there. No org-wide SQL aggregate exists for "overdue across
  all clients" or counts; RLS (`is_admin_of_client`, evaluated per row) already scopes a plain
  `select` on `clients`/`profiles`/`shifts` to the signed-in admin's own organisation with no manual
  filter needed. `shifts` has two FKs to `profiles` (`carer_id`, `created_by`), so the `carer:profiles(...)`
  embed needed the `!shifts_carer_id_fkey` hint to resolve.
Important decisions: FD-01 (feature DECISIONS.md) — overdue window (30 days) and row caps (20) on
  overdue/upcoming, looped per-client overdue derivation (reusing `loadOccurrences`, no new SQL RPC,
  since F0-09's recurrence engine is TypeScript-only), staff count scoped to active carers, nurse name
  corrected to full name (PD-038); removed test flagged HUMAN REVIEW. Root DECISIONS.md CHG-034:
  Upcoming shifts brought into ADM-01's own scope (human, in-session, reversing CHG-006's "no live
  shift queries" restriction).
Exact next action: None in ADM-01's own scope — open the PR to `admin-dev` once the human approves
  (CLAUDE.md §8/§10: never open without prior approval). Flag FD-01's removed test, the per-client
  fan-out performance note, and CHG-034 for human review in the PR body.
Files likely to be touched next: none expected for ADM-01.
Warning for next session: Do not touch `src/app/(admin)/admin/home/**` or `src/features/admin-home/**`
  UI — that's ADM-UI-01's already-merged work, not ADM-01's scope. If an organisation's client count
  grows large, the per-client fan-out in `getAdminHome()`'s overdue derivation is the first thing to
  revisit (see PROGRESS.md's HUMAN REVIEW: performance note).
